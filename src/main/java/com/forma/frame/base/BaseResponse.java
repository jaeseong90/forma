package com.forma.frame.base;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BaseResponse<T> {

    private String resultCode;
    private String resultMessage;
    private T resultData;

    public static <T> BaseResponse<T> Ok() {
        BaseResponse<T> r = new BaseResponse<>();
        r.resultCode = ResultCode.OK.name();
        return r;
    }

    public static <T> BaseResponse<T> Ok(T data) {
        BaseResponse<T> r = new BaseResponse<>();
        r.resultCode = ResultCode.OK.name();
        r.resultData = data;
        return r;
    }

    public static <T> BaseResponse<T> Warn(String message) {
        BaseResponse<T> r = new BaseResponse<>();
        r.resultCode = ResultCode.WARN.name();
        r.resultMessage = message;
        return r;
    }

    public static <T> BaseResponse<T> Error(String message) {
        BaseResponse<T> r = new BaseResponse<>();
        r.resultCode = ResultCode.ERROR.name();
        r.resultMessage = message;
        return r;
    }
}
