package com.forma.common;

import com.forma.frame.base.BaseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/codes")
@RequiredArgsConstructor
public class CodeController {

    private final CommonService commonService;

    @GetMapping("/{grpCode}")
    public BaseResponse<List<Map<String, Object>>> getCodeList(@PathVariable String grpCode) {
        return BaseResponse.Ok(commonService.selectCodeList(grpCode));
    }
}
