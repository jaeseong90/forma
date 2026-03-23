package com.forma.frame.excel;

import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.OutputStream;
import java.util.List;
import java.util.Map;

/**
 * Apache POI SXSSF(스트리밍) 기반 XLSX 생성.
 * 대량 데이터(10만건+)에서도 메모리 효율적.
 */
@Slf4j
@Service
public class ExcelService {

    public void writeXlsx(OutputStream out, String sheetName,
                          List<Map<String, Object>> columns,
                          List<Map<String, Object>> data) throws Exception {

        try (SXSSFWorkbook wb = new SXSSFWorkbook(500)) {
            Sheet sheet = wb.createSheet(sheetName);

            // --- 헤더 스타일 ---
            CellStyle headerStyle = wb.createCellStyle();
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            Font headerFont = wb.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);

            // --- 본문 스타일 ---
            CellStyle bodyStyle = wb.createCellStyle();
            bodyStyle.setBorderBottom(BorderStyle.THIN);
            bodyStyle.setBorderTop(BorderStyle.THIN);
            bodyStyle.setBorderLeft(BorderStyle.THIN);
            bodyStyle.setBorderRight(BorderStyle.THIN);

            CellStyle numberStyle = wb.createCellStyle();
            numberStyle.cloneStyleFrom(bodyStyle);
            numberStyle.setAlignment(HorizontalAlignment.RIGHT);
            DataFormat fmt = wb.createDataFormat();
            numberStyle.setDataFormat(fmt.getFormat("#,##0"));

            // --- 헤더 행 ---
            Row headerRow = sheet.createRow(0);
            for (int c = 0; c < columns.size(); c++) {
                Map<String, Object> col = columns.get(c);
                Cell cell = headerRow.createCell(c);
                cell.setCellValue(toString(col.get("label")));
                cell.setCellStyle(headerStyle);

                // 컬럼 너비 (문자 수 * 256)
                Object w = col.get("width");
                int charWidth = w != null ? toInt(w) : 15;
                sheet.setColumnWidth(c, charWidth * 256);
            }

            // --- 데이터 행 ---
            for (int r = 0; r < data.size(); r++) {
                Row row = sheet.createRow(r + 1);
                Map<String, Object> record = data.get(r);

                for (int c = 0; c < columns.size(); c++) {
                    Map<String, Object> col = columns.get(c);
                    String field = (String) col.get("field");
                    Object value = record.get(field);
                    Cell cell = row.createCell(c);

                    String type = toString(col.get("type"));
                    String format = toString(col.get("format"));

                    if (value == null) {
                        cell.setCellValue("");
                        cell.setCellStyle(bodyStyle);
                    } else if ("number".equals(type) || "currency".equals(format) || value instanceof Number) {
                        cell.setCellValue(toDouble(value));
                        cell.setCellStyle(numberStyle);
                    } else {
                        cell.setCellValue(String.valueOf(value));
                        cell.setCellStyle(bodyStyle);
                    }
                }
            }

            wb.write(out);
            out.flush();
        }
    }

    private String toString(Object v) {
        return v == null ? "" : String.valueOf(v);
    }

    private int toInt(Object v) {
        if (v instanceof Number) return ((Number) v).intValue();
        try { return Integer.parseInt(String.valueOf(v)); } catch (Exception e) { return 15; }
    }

    private double toDouble(Object v) {
        if (v instanceof Number) return ((Number) v).doubleValue();
        try { return Double.parseDouble(String.valueOf(v)); } catch (Exception e) { return 0; }
    }
}
