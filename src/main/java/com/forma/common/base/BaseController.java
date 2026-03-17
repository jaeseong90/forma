package com.forma.common.base;

import com.forma.common.model.ApiResponse;
import com.forma.common.model.PageResult;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 모든 Controller의 베이스.
 * AI가 생성하는 Controller는 이 클래스를 상속하고,
 * getService()만 구현하면 기본 CRUD API가 완성된다.
 * 커스텀 엔드포인트는 서브클래스에 추가.
 */
public abstract class BaseController {

    protected abstract BaseService service();

    @GetMapping
    public ApiResponse<PageResult<Map<String, Object>>> list(@RequestParam Map<String, String> params) {
        return ApiResponse.ok(service().list(params));
    }

    @GetMapping("/{id}")
    public ApiResponse<Map<String, Object>> get(@PathVariable String id) {
        return ApiResponse.ok(service().get(id));
    }

    @PostMapping
    public ApiResponse<Map<String, Object>> save(@RequestBody Map<String, Object> body) {
        return ApiResponse.ok(service().save(body));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable String id) {
        service().delete(id);
        return ApiResponse.ok();
    }
}
