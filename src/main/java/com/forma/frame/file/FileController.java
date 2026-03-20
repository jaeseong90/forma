package com.forma.frame.file;

import com.forma.frame.base.BaseResponse;
import com.forma.frame.util.Constants;
import com.forma.login.LoginUserVo;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/file")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;

    /**
     * 파일 업로드 (다건)
     */
    @PostMapping("/upload")
    public BaseResponse<List<Map<String, Object>>> upload(
            @RequestParam("files") MultipartFile[] files,
            @RequestParam("refType") String refType,
            @RequestParam("refId") String refId,
            HttpServletRequest request) {
        LoginUserVo user = (LoginUserVo) request.getAttribute(Constants.LOGIN_USER_ATTR);
        String userId = user != null ? user.getUserId() : "system";
        List<Map<String, Object>> result = fileService.uploadFiles(files, refType, refId, userId);
        return BaseResponse.Ok(result);
    }

    /**
     * 파일 목록 조회
     */
    @GetMapping("/list")
    public BaseResponse<List<Map<String, Object>>> list(
            @RequestParam("refType") String refType,
            @RequestParam("refId") String refId) {
        return BaseResponse.Ok(fileService.selectFiles(refType, refId));
    }

    /**
     * 파일 다운로드
     */
    @GetMapping("/download/{fileId}")
    public void download(@PathVariable String fileId, HttpServletResponse response) {
        fileService.downloadFile(fileId, response);
    }

    /**
     * 파일 삭제
     */
    @PostMapping("/delete")
    public BaseResponse<?> delete(@RequestBody Map<String, Object> param) {
        String fileId = (String) param.get("fileId");
        fileService.deleteFile(fileId);
        return BaseResponse.Ok(null);
    }
}
