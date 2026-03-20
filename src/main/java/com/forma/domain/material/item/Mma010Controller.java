package com.forma.domain.material.item;

import com.forma.frame.annotation.AddUserInfo;
import com.forma.frame.annotation.FormaController;
import com.forma.frame.base.BaseController;
import com.forma.frame.base.BaseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;
import java.util.Map;

@FormaController(value = "/mma010", pgmId = "MMA010", description = "품목관리")
@RequiredArgsConstructor
public class Mma010Controller extends BaseController {

    private final Mma010Service service;

    @PostMapping("/selectGrid1")
    public BaseResponse<List<Map<String, Object>>> selectGrid1(@RequestBody Map<String, Object> param) {
        return BaseResponse.Ok(service.selectGrid1(param));
    }

    @AddUserInfo
    @PostMapping("/saveGrid1")
    public BaseResponse<?> saveGrid1(@RequestBody List<Map<String, Object>> param) {
        service.saveGrid1(param);
        return BaseResponse.Ok(param);
    }

    @AddUserInfo
    @PostMapping("/deleteGrid1")
    public BaseResponse<?> deleteGrid1(@RequestBody List<Map<String, Object>> param) {
        service.deleteGrid1(param);
        return BaseResponse.Ok(param);
    }
}
