package com.forma.frame.excel;

import com.forma.frame.base.BaseController;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

/**
 * XLSX 서버사이드 다운로드.
 *
 * 프론트에서 컬럼 정의 + 데이터를 POST로 전송하면
 * 서버에서 Apache POI로 XLSX를 생성해 스트림 응답한다.
 *
 * POST /api/excel/download
 * {
 *   "fileName": "거래처목록",
 *   "sheetName": "Sheet1",
 *   "columns": [
 *     { "field": "cust_cd", "label": "거래처코드", "width": 15 },
 *     { "field": "cust_nm", "label": "거래처명", "width": 30 }
 *   ],
 *   "data": [ { "cust_cd": "C001", "cust_nm": "삼성전자" }, ... ]
 * }
 */
@Slf4j
@RestController
@RequestMapping("/api/excel")
@RequiredArgsConstructor
public class ExcelController extends BaseController {

    private final ExcelService excelService;

    @PostMapping("/download")
    public void download(@RequestBody Map<String, Object> param, HttpServletResponse response) {
        try {
            String fileName = (String) param.getOrDefault("fileName", "export");
            String sheetName = (String) param.getOrDefault("sheetName", "Sheet1");

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> columns = (List<Map<String, Object>>) param.get("columns");
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> data = (List<Map<String, Object>>) param.get("data");

            if (columns == null || columns.isEmpty()) {
                response.sendError(400, "columns 정의가 필요합니다.");
                return;
            }
            if (data == null) {
                data = List.of();
            }

            String encodedName = URLEncoder.encode(fileName + ".xlsx", StandardCharsets.UTF_8)
                    .replaceAll("\\+", "%20");

            response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            response.setHeader("Content-Disposition", "attachment; filename*=UTF-8''" + encodedName);

            excelService.writeXlsx(response.getOutputStream(), sheetName, columns, data);
        } catch (Exception e) {
            log.error("Excel download failed", e);
        }
    }
}
