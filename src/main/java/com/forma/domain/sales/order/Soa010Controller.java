package com.forma.domain.sales.order;

import com.forma.frame.annotation.AddUserInfo;
import com.forma.frame.annotation.FormaController;
import com.forma.frame.base.BaseController;
import com.forma.frame.base.BaseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;
import java.util.Map;

@FormaController(value = "/soa010", pgmId = "SOA010", description = "수주관리")
@RequiredArgsConstructor
public class Soa010Controller extends BaseController {

    private final Soa010Service service;

    @PostMapping("/selectGrid1")
    public BaseResponse<List<Map<String, Object>>> selectGrid1(@RequestBody Map<String, Object> param) {
        return BaseResponse.Ok(service.selectGrid1(param));
    }

    @PostMapping("/selectGrid2")
    public BaseResponse<List<Map<String, Object>>> selectGrid2(@RequestBody Map<String, Object> param) {
        return BaseResponse.Ok(service.selectGrid2(param));
    }

    @AddUserInfo
    @PostMapping("/saveAll")
    public BaseResponse<?> saveAll(@RequestBody Map<String, Object> param) {
        return BaseResponse.Ok(service.saveAll(param));
    }

    @AddUserInfo
    @PostMapping("/deleteGrid1")
    public BaseResponse<?> deleteGrid1(@RequestBody List<Map<String, Object>> param) {
        service.deleteGrid1(param);
        return BaseResponse.Ok();
    }

    @PostMapping("/approve")
    public BaseResponse<?> approve(@RequestBody Map<String, Object> param) {
        service.approve(param);
        return BaseResponse.Ok();
    }
}
