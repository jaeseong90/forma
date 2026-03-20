package com.forma.frame.auth;

import com.forma.frame.mybatis.FormaSqlSession;
import com.forma.login.LoginUserVo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class DataAuthService {

    private final FormaSqlSession sql;

    // 부서 트리 캐시 (deptCode → 하위 부서 코드 목록)
    private final Map<String, List<String>> deptTreeCache = new ConcurrentHashMap<>();
    private volatile long cacheExpiry = 0;
    private static final long CACHE_TTL = 5 * 60 * 1000; // 5분

    /**
     * 사용자의 데이터 권한 파라미터를 구성한다.
     * FormaSqlSession의 SELECT에 자동 주입된다.
     */
    public Map<String, Object> buildAuthParams(LoginUserVo user) {
        Map<String, Object> params = new HashMap<>();
        params.put("_userId", user.getUserId());
        params.put("_userDept", user.getUserDeptCode());
        params.put("_isAdmin", user.isAdmin());

        if (user.isAdmin()) {
            params.put("_dataAuthType", "ALL");
            return params;
        }

        // 데이터 권한 타입 조회 (가장 넓은 권한)
        String authType = resolveAuthType(user.getUserId());
        params.put("_dataAuthType", authType);

        // DEPT_SUB인 경우 하위 부서 목록
        if ("DEPT_SUB".equals(authType) && user.getUserDeptCode() != null) {
            params.put("_deptList", resolveChildDepts(user.getUserDeptCode()));
        }

        return params;
    }

    private String resolveAuthType(String userId) {
        List<Map<String, Object>> authList = sql.selectList("login.selectDataAuth", Map.of("user_id", userId));
        if (authList == null || authList.isEmpty()) {
            return "USER"; // 기본값: 본인 데이터만
        }
        // 가장 넓은 권한 (쿼리가 이미 넓은 순으로 정렬)
        return (String) authList.get(0).get("AUTH_TYPE");
    }

    public List<String> resolveChildDepts(String deptCode) {
        // 캐시 만료 체크
        if (System.currentTimeMillis() > cacheExpiry) {
            deptTreeCache.clear();
            cacheExpiry = System.currentTimeMillis() + CACHE_TTL;
        }

        return deptTreeCache.computeIfAbsent(deptCode, code -> {
            // 전체 부서를 조회한 뒤 Java에서 트리 탐색 (DB 호환성)
            List<Map<String, Object>> allDepts = sql.selectList("common.selectAllDepts");
            Map<String, List<String>> childMap = new HashMap<>();
            for (Map<String, Object> row : allDepts) {
                String parent = (String) row.get("PARENT_CODE");
                if (parent != null) {
                    childMap.computeIfAbsent(parent, k -> new ArrayList<>()).add((String) row.get("DEPT_CODE"));
                }
            }
            List<String> result = new ArrayList<>();
            collectChildren(code, childMap, result);
            if (result.isEmpty()) {
                result.add(code);
            }
            return result;
        });
    }

    private void collectChildren(String code, Map<String, List<String>> childMap, List<String> result) {
        result.add(code);
        List<String> children = childMap.get(code);
        if (children != null) {
            for (String child : children) {
                collectChildren(child, childMap, result);
            }
        }
    }
}
