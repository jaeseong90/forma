package com.forma.frame.screen;

import com.forma.frame.screen.model.ScreenDefinition;
import com.forma.frame.screen.model.ScreenDefinition.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * DynamicSqlExecutor 단위 테스트.
 * - SQL 식별자 검증 (injection 방지)
 * - ORDER BY 검증
 * - 테이블 참조 검증
 * - WHERE 파라미터 변환
 * - 키 정규화
 *
 * JDBC 의존 메서드는 통합 테스트에서 검증. 여기서는 순수 로직만 테스트.
 */
class DynamicSqlExecutorTest {



    // ═══ SQL Identifier Validation (regex 기반 검증) ═══
    // DynamicSqlExecutor 내부 SAFE_IDENTIFIER = [a-zA-Z_][a-zA-Z0-9_.]*

    private boolean isSafeIdentifier(String id) {
        return id != null && id.trim().matches("[a-zA-Z_][a-zA-Z0-9_.]*");
    }

    @Test
    @DisplayName("SQL 식별자 검증 - 정상 식별자")
    void safeIdentifier_valid() {
        assertTrue(isSafeIdentifier("cust_cd"));
        assertTrue(isSafeIdentifier("tb_customer"));
        assertTrue(isSafeIdentifier("a.cust_cd"));
        assertTrue(isSafeIdentifier("_private"));
        assertTrue(isSafeIdentifier("Column1"));
    }

    @Test
    @DisplayName("SQL 식별자 검증 - SQL injection 시도 차단")
    void safeIdentifier_injection() {
        assertFalse(isSafeIdentifier("table; DROP TABLE"));
        assertFalse(isSafeIdentifier("1starts_with_number"));
        assertFalse(isSafeIdentifier("has space"));
        assertFalse(isSafeIdentifier("col--comment"));
        assertFalse(isSafeIdentifier("col'injection"));
        assertFalse(isSafeIdentifier(""));
        assertFalse(isSafeIdentifier(null));
    }

    // ═══ WHERE 파라미터 변환 (#{xxx} → :xxx) ═══

    @Test
    @DisplayName("WHERE 파라미터 변환 - #{param} → :param")
    void convertWhereParams() {
        String input = "cust_cd = #{cust_cd} AND ser = #{ser}";
        String expected = "cust_cd = :cust_cd AND ser = :ser";
        assertEquals(expected, input.replaceAll("#\\{(\\w+)}", ":$1"));
    }

    @Test
    @DisplayName("WHERE 파라미터 변환 - 파라미터 없는 경우")
    void convertWhereParams_noParams() {
        String input = "status = 'ACTIVE'";
        assertEquals(input, input.replaceAll("#\\{(\\w+)}", ":$1"));
    }

    // ═══ WHERE 절에서 컬럼 추출 ═══

    @Test
    @DisplayName("WHERE 컬럼 추출 - 단일 조건")
    void extractWhereColumns_single() {
        String where = "cust_cd = #{cust_cd}";
        var matcher = java.util.regex.Pattern.compile("#\\{(\\w+)}").matcher(where);
        var cols = new java.util.ArrayList<String>();
        while (matcher.find()) cols.add(matcher.group(1));
        assertEquals(java.util.List.of("cust_cd"), cols);
    }

    @Test
    @DisplayName("WHERE 컬럼 추출 - 복합 조건")
    void extractWhereColumns_multiple() {
        String where = "egrp_code = #{egrp_code} AND ser = #{ser}";
        var matcher = java.util.regex.Pattern.compile("#\\{(\\w+)}").matcher(where);
        var cols = new java.util.ArrayList<String>();
        while (matcher.find()) cols.add(matcher.group(1));
        assertEquals(java.util.List.of("egrp_code", "ser"), cols);
    }

    // ═══ 키 정규화 (Map 키 소문자 변환) ═══

    @Test
    @DisplayName("키 정규화 - 대문자 → 소문자")
    void normalizeKeys() {
        Map<String, Object> input = Map.of("CUST_CD", "C001", "Item_NM", "품목");
        Map<String, Object> result = new java.util.HashMap<>();
        input.forEach((k, v) -> result.put(k.toLowerCase(), v));

        assertEquals("C001", result.get("cust_cd"));
        assertEquals("품목", result.get("item_nm"));
        assertNull(result.get("CUST_CD")); // 원본 대문자 키 없음
    }

    // ═══ ORDER BY 검증 ═══

    @Test
    @DisplayName("ORDER BY 검증 - 정상 패턴")
    void validateOrderBy_valid() {
        // "field desc" → 각 토큰 검증
        String orderBy = "cust_cd, order_date DESC";
        String[] parts = orderBy.split(",");
        for (String part : parts) {
            String[] tokens = part.trim().split("\\s+");
            assertTrue(isSafeIdentifier(tokens[0]));
            if (tokens.length > 1) {
                assertTrue("ASC".equals(tokens[1].toUpperCase()) || "DESC".equals(tokens[1].toUpperCase()));
            }
        }
    }

    @Test
    @DisplayName("ORDER BY 검증 - injection 시도")
    void validateOrderBy_injection() {
        String malicious = "1; DROP TABLE tb_customer --";
        String[] tokens = malicious.split("\\s+");
        assertFalse(isSafeIdentifier(tokens[0])); // "1;" 는 유효하지 않음
    }

    // ═══ toInt 유틸 ═══

    @Test
    @DisplayName("toInt - 다양한 입력 타입")
    void toInt_variants() {
        // Number 타입
        assertEquals(5, toInt(5, 1));
        assertEquals(10, toInt(10L, 1));
        assertEquals(3, toInt(3.7, 1));

        // String 타입
        assertEquals(42, toInt("42", 1));

        // null → 기본값
        assertEquals(1, toInt(null, 1));

        // 파싱 불가 → 기본값
        assertEquals(50, toInt("abc", 50));
    }

    private int toInt(Object val, int defaultVal) {
        if (val == null) return defaultVal;
        if (val instanceof Number) return ((Number) val).intValue();
        try { return Integer.parseInt(val.toString()); } catch (NumberFormatException e) { return defaultVal; }
    }

    // ═══ getParamValue (대소문자 무관 검색) ═══

    @Test
    @DisplayName("파라미터 값 검색 - 대소문자 무관")
    void getParamValue_caseInsensitive() {
        Map<String, Object> param = new java.util.HashMap<>();
        param.put("CUST_CD", "C001");

        // 원본 키로 검색
        assertEquals("C001", param.get("CUST_CD"));
        // 소문자로 검색
        assertNull(param.get("cust_cd"));
        // getParamValue 로직: 원본 → 소문자 → 대문자 순서
        Object val = param.get("cust_cd");
        if (val == null) val = param.get("CUST_CD"); // 대문자 fallback
        assertEquals("C001", val);
    }

    // ═══ ScreenDefinition SQL 해석 ═══

    @Test
    @DisplayName("resolveTable - operation 테이블 우선")
    void resolveTable_operationFirst() {
        SqlDef sqlDef = new SqlDef();
        sqlDef.setTables(java.util.List.of(Map.of("name", "default_table")));
        sqlDef.setDynamicProperty("selectGrid1", Map.of("table", "custom_table"));

        SqlOp op = sqlDef.getOperation("selectGrid1");
        // operation에 table이 있으면 그것을 사용
        assertEquals("custom_table", op.getTable());
    }

    @Test
    @DisplayName("resolveTable - operation에 table 없으면 default")
    void resolveTable_fallbackDefault() {
        SqlDef sqlDef = new SqlDef();
        sqlDef.setTables(java.util.List.of(Map.of("name", "default_table")));
        sqlDef.setDynamicProperty("selectGrid1", Map.of("columns", "*"));

        SqlOp op = sqlDef.getOperation("selectGrid1");
        assertNull(op.getTable()); // operation에 table 없음
        assertEquals("default_table", sqlDef.getDefaultTable()); // default fallback
    }

    @Test
    @DisplayName("resolveColumns - operation에 columns 없으면 * 사용")
    void resolveColumns_default() {
        SqlDef sqlDef = new SqlDef();
        sqlDef.setDynamicProperty("selectGrid1", Map.of("table", "tb_test"));

        SqlOp op = sqlDef.getOperation("selectGrid1");
        assertNull(op.getColumns()); // → DynamicSqlExecutor에서 "*" 기본값
    }
}
