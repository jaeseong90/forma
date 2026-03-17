package com.forma.common.util;

import com.forma.common.model.ApiResponse;
import jakarta.annotation.PostConstruct;
import org.springframework.core.io.ClassPathResource;
import org.springframework.web.bind.annotation.*;

import java.io.*;
import java.util.*;

/**
 * 코드 사전 API. design/_codes.yml을 파싱하여 서비스.
 * 프론트의 combo, badge 등이 이 API로 코드 목록을 가져간다.
 */
@RestController
@RequestMapping("/api/codes")
public class CodeController {

    private Map<String, Object> codes = new LinkedHashMap<>();

    @PostConstruct
    public void loadCodes() {
        // 간이 YAML 파서 (외부 라이브러리 없이)
        // 실제로는 SnakeYAML 하나 추가하거나, JSON으로 전환 가능
        try {
            ClassPathResource res = new ClassPathResource("codes.json");
            if (res.exists()) {
                // JSON 방식 (Jackson은 이미 있으므로)
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                codes = mapper.readValue(res.getInputStream(), Map.class);
            }
        } catch (Exception e) {
            // 코드 파일 없으면 빈 상태로 시작
        }
    }

    @GetMapping
    public ApiResponse<Map<String, Object>> getAll() {
        return ApiResponse.ok(codes);
    }

    @GetMapping("/{codeGroup}")
    public ApiResponse<Object> getGroup(@PathVariable String codeGroup) {
        Object group = codes.get(codeGroup);
        if (group == null) return ApiResponse.error("코드 그룹 없음: " + codeGroup);
        return ApiResponse.ok(group);
    }
}
