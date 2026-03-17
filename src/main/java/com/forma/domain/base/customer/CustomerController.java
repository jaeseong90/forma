package com.forma.domain.base.customer;

import com.forma.common.model.ApiResponse;
import com.forma.common.model.PageResult;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/customer")
public class CustomerController {

    private final CustomerService service;

    public CustomerController(CustomerService service) {
        this.service = service;
    }

    @GetMapping
    public ApiResponse<PageResult<Map<String, Object>>> list(@RequestParam Map<String, String> params) {
        return ApiResponse.ok(service.list(params));
    }

    @GetMapping("/{id}")
    public ApiResponse<Map<String, Object>> get(@PathVariable String id) {
        return ApiResponse.ok(service.get(id));
    }

    @PostMapping
    public ApiResponse<Map<String, Object>> save(@RequestBody Map<String, Object> body) {
        return ApiResponse.ok(service.save(body));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ApiResponse.ok();
    }
}
