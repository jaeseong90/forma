package com.forma.common;

import com.forma.frame.base.BaseController;
import com.forma.frame.base.BaseResponse;
import com.forma.frame.mybatis.FormaSqlSession;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 공통 팝업 검색 API.
 * 거래처/품목 등 공통 코드 팝업에서 사용.
 */
@RestController
@RequestMapping("/api/popup")
@RequiredArgsConstructor
public class PopupController extends BaseController {

    private final FormaSqlSession sql;

    @PostMapping("/customer")
    public BaseResponse<List<Map<String, Object>>> searchCustomer(@RequestBody Map<String, Object> param) {
        return BaseResponse.Ok(sql.selectList("popup.selectCustomer", param));
    }

    @PostMapping("/item")
    public BaseResponse<List<Map<String, Object>>> searchItem(@RequestBody Map<String, Object> param) {
        return BaseResponse.Ok(sql.selectList("popup.selectItem", param));
    }
}
