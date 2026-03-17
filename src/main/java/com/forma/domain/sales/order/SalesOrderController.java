package com.forma.domain.sales.order;

// Generated from: design/screens/ORD-001.yml (type: master-detail)

import com.forma.common.base.BaseController;
import com.forma.common.base.BaseService;
import com.forma.common.model.ApiResponse;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sales-order")
public class SalesOrderController extends BaseController {

    private final SalesOrderService service;

    public SalesOrderController(SalesOrderService service) {
        this.service = service;
    }

    @Override
    protected BaseService service() { return service; }

    /** 디테일(품목) 조회 — 설계서 detail 섹션 */
    @GetMapping("/{orderNo}/items")
    public ApiResponse<List<Map<String, Object>>> getItems(@PathVariable String orderNo) {
        return ApiResponse.ok(service.getItems(orderNo));
    }

    /** 마스터+디테일 동시 저장 — 설계서 type: master-detail */
    @PostMapping("/save-all")
    public ApiResponse<Map<String, Object>> saveAll(@RequestBody Map<String, Object> body) {
        return ApiResponse.ok(service.saveAll(body));
    }

    /** 승인 — 설계서 actions.approve (CUSTOM) */
    @PostMapping("/{id}/approve")
    public ApiResponse<Void> approve(@PathVariable String id) {
        service.approve(id);
        return ApiResponse.ok();
    }
}
