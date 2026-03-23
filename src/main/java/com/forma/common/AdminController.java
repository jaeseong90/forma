package com.forma.common;

import com.forma.frame.base.BaseController;
import com.forma.frame.base.BaseResponse;
import com.forma.frame.mybatis.FormaSqlSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 관리자 화면 API (감사 로그 조회 등)
 */
@Slf4j
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController extends BaseController {

    private final FormaSqlSession sql;

    @PostMapping("/auditLog")
    public BaseResponse<Map<String, Object>> selectAuditLog(@RequestBody Map<String, Object> param) {
        try {
            int page = param.get("page") != null ? ((Number) param.get("page")).intValue() : 1;
            int pageSize = param.get("pageSize") != null ? ((Number) param.get("pageSize")).intValue() : 50;
            param.put("_offset", (page - 1) * pageSize);

            // 검색 필드를 search_ 접두사로 매핑 (데이터권한 파라미터와 충돌 방지)
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
}
