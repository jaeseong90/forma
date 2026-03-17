package com.forma.domain.base.estimate;

import com.forma.frame.annotation.AddUserInfo;
import com.forma.frame.annotation.FormaController;
import com.forma.frame.base.BaseController;
import com.forma.frame.base.BaseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;
import java.util.Map;

@FormaController(value = "/sda020", pgmId = "SDA020", description = "견적템플릿관리")
@RequiredArgsConstructor
public class Sda020Controller extends BaseController {

    private final Sda020Service service;

    @PostMapping("/selectGrid1")
    public BaseResponse<List<Map<String, Object>>> selectGrid1(@RequestBody Map<String, Object> param) {
        return BaseResponse.Ok(service.selectGrid1(param));
    }

    @PostMapping("/selectGrid2")
    public BaseResponse<List<Map<String, Object>>> selectGrid2(@RequestBody Map<String, Object> param) {
        return BaseResponse.Ok(service.selectGrid2(param));
    }

    @AddUserInfo
    @PostMapping("/saveGrid2")
    public BaseResponse<?> saveGrid2(@RequestBody List<Map<String, Object>> param) {
        service.saveGrid2(param);
        return BaseResponse.Ok();
    }

    @AddUserInfo
    @PostMapping("/deleteGrid2")
    public BaseResponse<?> deleteGrid2(@RequestBody List<Map<String, Object>> param) {
        service.deleteGrid2(param);
        return BaseResponse.Ok();
    }
}
