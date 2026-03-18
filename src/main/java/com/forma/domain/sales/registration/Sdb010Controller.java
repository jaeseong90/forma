package com.forma.domain.sales.registration;

import com.forma.frame.annotation.AddUserInfo;
import com.forma.frame.annotation.FormaController;
import com.forma.frame.base.BaseController;
import com.forma.frame.base.BaseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;
import java.util.Map;

@FormaController(value = "/sdb010", pgmId = "SDB010", description = "수주등록")
@RequiredArgsConstructor
public class Sdb010Controller extends BaseController {

    private final Sdb010Service service;

    @PostMapping("/selectGrid1")
    public BaseResponse<List<Map<String, Object>>> selectGrid1(@RequestBody Map<String, Object> param) {
        return BaseResponse.Ok(service.selectGrid1(param));
    }

    @PostMapping("/selectMaster")
    public BaseResponse<Map<String, Object>> selectMaster(@RequestBody Map<String, Object> param) {
        return BaseResponse.Ok(service.selectMaster(param));
    }

    @PostMapping("/selectGrid2")
    public BaseResponse<List<Map<String, Object>>> selectGrid2(@RequestBody Map<String, Object> param) {
        return BaseResponse.Ok(service.selectGrid2(param));
    }

    @PostMapping("/selectGrid3")
    public BaseResponse<List<Map<String, Object>>> selectGrid3(@RequestBody Map<String, Object> param) {
        return BaseResponse.Ok(service.selectGrid3(param));
    }

    @AddUserInfo
    @PostMapping("/saveMaster")
    public BaseResponse<?> saveMaster(@RequestBody Map<String, Object> param) {
        return BaseResponse.Ok(service.saveMaster(param));
    }

    @AddUserInfo
    @PostMapping("/deleteMaster")
    public BaseResponse<?> deleteMaster(@RequestBody Map<String, Object> param) {
        service.deleteMaster(param);
        return BaseResponse.Ok();
    }

    @AddUserInfo
    @PostMapping("/approve")
    public BaseResponse<?> approve(@RequestBody Map<String, Object> param) {
        service.approve(param);
        return BaseResponse.Ok();
    }
}
