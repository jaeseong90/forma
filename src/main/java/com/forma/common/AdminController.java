package com.forma.common;

import com.forma.frame.base.BaseController;
import com.forma.frame.base.BaseResponse;
import com.forma.frame.mybatis.FormaSqlSession;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 관리자 화면 API (감사 로그 조회 등)
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController extends BaseController {

    private final FormaSqlSession sql;

    @PostMapping("/auditLog")
    public BaseResponse<Map<String, Object>> selectAuditLog(@RequestBody Map<String, Object> param) {
        int page = param.get("page") != null ? ((Number) param.get("page")).intValue() : 1;
        int pageSize = param.get("pageSize") != null ? ((Number) param.get("pageSize")).intValue() : 50;
        param.put("_offset", (page - 1) * pageSize);

        Map<String, Object> result = new HashMap<>();
        result.put("data", sql.selectList("common.selectAuditLog", param));
        result.put("totalCount", (int) sql.selectOne("common.selectAuditLogCount", param));
        return BaseResponse.Ok(result);
    }
}
