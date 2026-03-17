package com.forma.frame.mvc;

import com.forma.frame.annotation.FormaController;
import com.forma.frame.base.BaseResponse;
import com.forma.frame.exception.FormaException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.BindException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Slf4j
@RestControllerAdvice(annotations = FormaController.class)
public class GlobalExceptionAdvice {

    @ExceptionHandler(FormaException.class)
    public BaseResponse<Void> handleFormaException(FormaException e) {
        return BaseResponse.Warn(e.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public BaseResponse<Void> handleValidation(MethodArgumentNotValidException e) {
        String msg = e.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .orElse("입력값 검증 오류");
        return BaseResponse.Warn(msg);
    }

    @ExceptionHandler(BindException.class)
    public BaseResponse<Void> handleBind(BindException e) {
        String msg = e.getFieldErrors().stream()
                .findFirst()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .orElse("바인딩 오류");
        return BaseResponse.Warn(msg);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public BaseResponse<Void> handleNotReadable(HttpMessageNotReadableException e) {
        return BaseResponse.Warn("JSON 형식 오류");
    }

    @ExceptionHandler(Exception.class)
    public BaseResponse<Void> handleException(Exception e) {
        log.error("Unhandled error", e);
        return BaseResponse.Error("시스템 오류: " + e.getMessage());
    }
}
