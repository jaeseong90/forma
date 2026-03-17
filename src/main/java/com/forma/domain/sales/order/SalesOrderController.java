package com.forma.domain.sales.order;

import com.forma.common.model.ApiResponse;
import com.forma.common.model.PageResult;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sales-order")
public class SalesOrderController {

    private final SalesOrderService service;

    public SalesOrderController(SalesOrderService service) {
        this.service = service;
    }

    @GetMapping
    public ApiResponse<PageResult<Map<String, Object>>> list(@RequestParam Map<String, String> params) {
        return ApiResponse.ok(service.list(params));
    }

    @GetMapping("/{orderNo}")
    public ApiResponse<Map<String, Object>> get(@PathVariable String orderNo) {
        return ApiResponse.ok(service.get(orderNo));
    }

    @GetMapping("/{orderNo}/items")
    public ApiResponse<List<Map<String, Object>>> getItems(@PathVariable String orderNo) {
        return ApiResponse.ok(service.getItems(orderNo));
    }

    @PostMapping("/save-all")
    public ApiResponse<Map<String, Object>> saveAll(@RequestBody Map<String, Object> body) {
        return ApiResponse.ok(service.saveAll(body));
    }

    @DeleteMapping("/{orderNo}")
    public ApiResponse<Void> delete(@PathVariable String orderNo) {
        service.delete(orderNo);
        return ApiResponse.ok();
    }

    @PostMapping("/{id}/approve")
    public ApiResponse<Void> approve(@PathVariable String id) {
        service.approve(id);
        return ApiResponse.ok();
    }
}
