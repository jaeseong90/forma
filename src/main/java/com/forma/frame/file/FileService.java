package com.forma.frame.file;

import com.forma.frame.exception.FormaException;
import com.forma.frame.mybatis.FormaSqlSession;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Service
public class FileService {

    private final FormaSqlSession sql;
    private final String uploadBase;

    public FileService(FormaSqlSession sql,
                       @Value("${forma.file.upload-path:./uploads}") String uploadBase) {
        this.sql = sql;
        // 상대 경로를 절대 경로로 변환
        this.uploadBase = java.nio.file.Paths.get(uploadBase).toAbsolutePath().toString();
        log.info("File upload path: {}", this.uploadBase);
    }

    /**
     * 다건 파일 업로드
     */
    public List<Map<String, Object>> uploadFiles(MultipartFile[] files, String refType, String refId, String userId) {
        List<Map<String, Object>> results = new ArrayList<>();
        String datePath = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM"));

        for (int i = 0; i < files.length; i++) {
            MultipartFile file = files[i];
            if (file.isEmpty()) continue;

            String fileId = UUID.randomUUID().toString().replace("-", "").substring(0, 20);
            String originalName = file.getOriginalFilename();
            String ext = originalName != null && originalName.contains(".")
                    ? originalName.substring(originalName.lastIndexOf(".")) : "";
            String storedName = fileId + ext;
            String relativePath = datePath + "/" + storedName;

            // 디렉토리 생성 + 저장
            Path dirPath = Paths.get(uploadBase, datePath);
            try {
                Files.createDirectories(dirPath);
                file.transferTo(dirPath.resolve(storedName).toFile());
            } catch (IOException e) {
                log.error("File upload failed: {}", originalName, e);
                throw new FormaException("파일 업로드 실패: " + originalName);
            }

            // DB 저장
            Map<String, Object> fileInfo = new HashMap<>();
            fileInfo.put("file_id", fileId);
            fileInfo.put("ref_type", refType);
            fileInfo.put("ref_id", refId);
            fileInfo.put("file_name", originalName);
            fileInfo.put("file_path", relativePath);
            fileInfo.put("file_size", file.getSize());
            fileInfo.put("content_type", file.getContentType());
            fileInfo.put("sort_order", i);
            fileInfo.put("user_id", userId);
            sql.insert("common.insertFile", fileInfo);

            results.add(Map.of(
                    "fileId", fileId,
                    "fileName", originalName != null ? originalName : "",
                    "fileSize", file.getSize()
            ));
        }

        log.info("Uploaded {} files for {}/{}", results.size(), refType, refId);
        return results;
    }

    /**
     * 파일 목록 조회
     */
    public List<Map<String, Object>> selectFiles(String refType, String refId) {
        return sql.selectList("common.selectFiles", Map.of("ref_type", refType, "ref_id", refId));
    }

    /**
     * 파일 다운로드
     */
    public void downloadFile(String fileId, HttpServletResponse response) {
        Map<String, Object> fileInfo = sql.selectOne("common.selectFileById", Map.of("file_id", fileId));
        if (fileInfo == null) {
            throw new FormaException("파일을 찾을 수 없습니다.");
        }

        String filePath = (String) fileInfo.get("FILE_PATH");
        String fileName = (String) fileInfo.get("FILE_NAME");
        String contentType = (String) fileInfo.get("CONTENT_TYPE");
        Path fullPath = Paths.get(uploadBase, filePath);

        if (!Files.exists(fullPath)) {
            throw new FormaException("파일이 존재하지 않습니다.");
        }

        try {
            response.setContentType(contentType != null ? contentType : "application/octet-stream");
            response.setHeader("Content-Disposition",
                    "attachment; filename=\"" + URLEncoder.encode(fileName, StandardCharsets.UTF_8) + "\"");
            response.setContentLengthLong(Files.size(fullPath));

            try (InputStream is = Files.newInputStream(fullPath);
                 OutputStream os = response.getOutputStream()) {
                is.transferTo(os);
            }
        } catch (IOException e) {
            throw new FormaException("파일 다운로드 실패");
        }
    }

    /**
     * 파일 삭제 (DB + 물리 파일)
     */
    public void deleteFile(String fileId) {
        Map<String, Object> fileInfo = sql.selectOne("common.selectFileById", Map.of("file_id", fileId));
        if (fileInfo == null) return;

        // 물리 파일 삭제
        String filePath = (String) fileInfo.get("FILE_PATH");
        try {
            Files.deleteIfExists(Paths.get(uploadBase, filePath));
        } catch (IOException e) {
            log.warn("Physical file delete failed: {}", filePath);
        }

        // DB 삭제
        sql.delete("common.deleteFile", Map.of("file_id", fileId));
    }
}
