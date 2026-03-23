package com.forma.common;

import com.forma.frame.base.BaseController;
import com.forma.frame.base.BaseResponse;
import com.forma.frame.mybatis.FormaSqlSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 관리자 화면 API (감사 로그, 사용자/역할/메뉴 관리)
 */
@Slf4j
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController extends BaseController {

    private final FormaSqlSession sql;
    private final BCryptPasswordEncoder passwordEncoder;

    // ═══ 감사 로그 ═══

    @PostMapping("/auditLog")
    public BaseResponse<Map<String, Object>> selectAuditLog(@RequestBody Map<String, Object> param) {
        try {
            int page = param.get("page") != null ? ((Number) param.get("page")).intValue() : 1;
            int pageSize = param.get("pageSize") != null ? ((Number) param.get("pageSize")).intValue() : 50;
            param.put("_offset", (page - 1) * pageSize);

            if (param.get("pgm_id") != null) param.put("search_pgm_id", param.get("pgm_id"));
            if (param.get("user_id") != null) param.put("search_user_id", param.get("user_id"));
            if (param.get("table_name") != null) param.put("search_table_name", param.get("table_name"));
            if (param.get("action") != null) param.put("search_action", param.get("action"));

            Map<String, Object> result = new HashMap<>();
            result.put("data", sql.selectList("common.selectAuditLog", param));
            Integer count = sql.selectOne("common.selectAuditLogCount", param);
            result.put("totalCount", count != null ? count : 0);
            return BaseResponse.Ok(result);
        } catch (Exception e) {
            log.error("Audit log query failed", e);
            return BaseResponse.Error("감사로그 조회 실패: " + e.getMessage());
        }
    }

    // ═══ 사용자 관리 ═══

    @PostMapping("/users")
    public BaseResponse<List<Map<String, Object>>> selectUsers(@RequestBody Map<String, Object> param) {
        return BaseResponse.Ok(sql.selectList("admin.selectUsers", param));
    }

    @PostMapping("/users/save")
    @Transactional
    public BaseResponse<?> saveUsers(@RequestBody List<Map<String, Object>> rows) {
        for (Map<String, Object> row : rows) {
            String gstat = (String) row.get("gstat");
            // 신규 사용자: 비밀번호 빈 문자열로 인코딩
            if ("I".equals(gstat)) {
                String rawPw = (String) row.getOrDefault("user_pw", "");
                row.put("user_pw", rawPw.isEmpty() ? "" : passwordEncoder.encode(rawPw));
                sql.insert("admin.insertUser", row);
            } else {
                sql.update("admin.updateUser", row);
            }
        }
        return BaseResponse.Ok();
    }

    @PostMapping("/users/resetPassword")
    public BaseResponse<?> resetPassword(@RequestBody Map<String, Object> param) {
        String userId = (String) param.get("user_id");
        if (userId == null) return BaseResponse.Warn("사용자 ID가 필요합니다.");
        param.put("user_pw", "");  // 빈 비밀번호로 초기화
        sql.update("admin.resetPassword", param);
        return BaseResponse.Ok("비밀번호가 초기화되었습니다.");
    }

    // ═══ 사용자-역할 매핑 ═══

    @PostMapping("/userRoles")
    public BaseResponse<List<Map<String, Object>>> selectUserRoles(@RequestBody Map<String, Object> param) {
        return BaseResponse.Ok(sql.selectList("admin.selectUserRoles", param));
    }

    @PostMapping("/userRoles/save")
    @Transactional
    public BaseResponse<?> saveUserRoles(@RequestBody Map<String, Object> param) {
        String userId = (String) param.get("user_id");
        @SuppressWarnings("unchecked")
        List<String> roles = (List<String>) param.get("roles");
        sql.delete("admin.deleteUserRoles", Map.of("user_id", userId));
        if (roles != null) {
            for (String role : roles) {
                sql.insert("admin.insertUserRole", Map.of("user_id", userId, "role_cd", role));
            }
        }
        return BaseResponse.Ok();
    }

    // ═══ 역할 관리 ═══

    @PostMapping("/roles")
    public BaseResponse<List<Map<String, Object>>> selectRoles(@RequestBody Map<String, Object> param) {
        return BaseResponse.Ok(sql.selectList("admin.selectRoles", param));
    }

    @PostMapping("/roles/save")
    @Transactional
    public BaseResponse<?> saveRoles(@RequestBody List<Map<String, Object>> rows) {
        for (Map<String, Object> row : rows) {
            if ("I".equals(row.get("gstat"))) {
                sql.insert("admin.insertRole", row);
            } else {
                sql.update("admin.updateRole", row);
            }
        }
        return BaseResponse.Ok();
    }

    // ═══ 역할-메뉴 권한 ═══

    @PostMapping("/roleMenus")
    public BaseResponse<List<Map<String, Object>>> selectRoleMenus(@RequestBody Map<String, Object> param) {
        return BaseResponse.Ok(sql.selectList("admin.selectRoleMenus", param));
    }

    @PostMapping("/roleMenus/save")
    @Transactional
    public BaseResponse<?> saveRoleMenus(@RequestBody List<Map<String, Object>> rows) {
        for (Map<String, Object> row : rows) {
            sql.delete("admin.deleteRoleMenu", row);
            sql.insert("admin.insertRoleMenu", row);
        }
        return BaseResponse.Ok();
    }

    // ═══ 메뉴 관리 ═══

    @PostMapping("/menus")
    public BaseResponse<List<Map<String, Object>>> selectMenus(@RequestBody Map<String, Object> param) {
        return BaseResponse.Ok(sql.selectList("admin.selectMenus", param));
    }

    @PostMapping("/menus/save")
    @Transactional
    public BaseResponse<?> saveMenus(@RequestBody List<Map<String, Object>> rows) {
        for (Map<String, Object> row : rows) {
            if ("I".equals(row.get("gstat"))) {
                sql.insert("admin.insertMenu", row);
            } else {
                sql.update("admin.updateMenu", row);
            }
        }
        return BaseResponse.Ok();
    }

    @PostMapping("/menus/delete")
    @Transactional
    public BaseResponse<?> deleteMenus(@RequestBody List<Map<String, Object>> rows) {
        for (Map<String, Object> row : rows) {
            sql.delete("admin.deleteMenu", row);
        }
        return BaseResponse.Ok();
    }

    // ═══ 부서 목록 (콤보용) ═══

    @GetMapping("/depts")
    public BaseResponse<List<Map<String, Object>>> selectDepts() {
        return BaseResponse.Ok(sql.selectList("admin.selectDepts", Map.of()));
    }
}
