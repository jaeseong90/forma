package com.forma.frame.screen;

import com.forma.frame.auth.DataAuthContext;
import com.forma.frame.screen.model.ScreenDefinition;
import com.forma.frame.screen.model.ScreenDefinition.*;
import com.forma.frame.exception.FormaException;
import com.forma.frame.util.Constants;
import com.forma.login.LoginUserVo;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import javax.sql.DataSource;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Component
public class DynamicSqlExecutor {

    private static final Pattern SAFE_IDENTIFIER = Pattern.compile("[a-zA-Z_][a-zA-Z0-9_.]*");
    private final NamedParameterJdbcTemplate jdbc;

    public DynamicSqlExecutor(@Qualifier("primaryDataSource") DataSource dataSource) {
        this.jdbc = new NamedParameterJdbcTemplate(dataSource);
    }

    // ==================== SELECT ====================

    /**
     * Paged select: returns Map with "data" (List) and "totalCount" (int).
     * Used when the grid has paging: true and page/pageSize params are present.
     */
    public Map<String, Object> executeSelectPaged(ScreenDefinition def, String action, Map<String, Object> param) {
        String baseSql = buildSelectSql(def, action, param);
        Map<String, Object> params = buildSelectParams(def, param);

        int page = toInt(param.get("page"), 1);
        int pageSize = toInt(param.get("pageSize"), 50);
        int offset = (page - 1) * pageSize;

        // COUNT query
        String countSql = "SELECT COUNT(*) FROM (" + baseSql + ") _cnt";
        log.debug("[DynamicSQL] COUNT: {}", countSql);
        Integer totalCount = jdbc.queryForObject(countSql, params, Integer.class);

        // Paged data query
        String pagedSql = baseSql + " LIMIT :_pageSize OFFSET :_offset";
        params.put("_pageSize", pageSize);
        params.put("_offset", offset);
        log.debug("[DynamicSQL] SELECT PAGED: {}", pagedSql);
        List<Map<String, Object>> data = jdbc.queryForList(pagedSql, params);

        Map<String, Object> result = new HashMap<>();
        result.put("data", data);
        result.put("totalCount", totalCount != null ? totalCount : 0);
        return result;
    }

    public List<Map<String, Object>> executeSelect(ScreenDefinition def, String action, Map<String, Object> param) {
        String sqlStr = buildSelectSql(def, action, param);
        Map<String, Object> params = buildSelectParams(def, param);
        log.debug("[DynamicSQL] SELECT: {}", sqlStr);
        return jdbc.queryForList(sqlStr, params);
    }

    /**
     * Build the SELECT SQL string (without LIMIT/OFFSET).
     */
    private String buildSelectSql(ScreenDefinition def, String action, Map<String, Object> param) {
        SqlDef sql = def.getSql();
        String table = resolveTable(sql, action);
        String columns = resolveColumns(sql, action);
        String orderBy = resolveOrderBy(sql, action);

        StringBuilder sb = new StringBuilder();
        sb.append("SELECT ").append(columns);
        sb.append(" FROM ").append(validateTableRef(table));

        // JOIN 처리
        ScreenDefinition.SqlOp op = sql.getOperation(action);
        if (op != null && op.getJoins() != null) {
            for (Map<String, String> join : op.getJoins()) {
                String joinType = join.getOrDefault("type", "INNER").toUpperCase();
                if (!joinType.matches("^(INNER|LEFT|RIGHT|FULL)$")) joinType = "INNER";
                sb.append(" ").append(joinType).append(" JOIN ");
                sb.append(validateTableRef(join.get("table")));
                if (join.get("alias") != null) sb.append(" ").append(validateIdentifier(join.get("alias")));
                sb.append(" ON ").append(join.get("on"));
            }
        }

        // SQL 정의의 where 절 (selectGrid2 등에서 마스터 키 필터링)
        List<String> conditions = new ArrayList<>();
        if (op != null && op.getWhere() != null && !op.getWhere().isEmpty()) {
            conditions.add(convertWhereParams(op.getWhere()));
        }

        // 검색 조건 동적 구성
        if (def.getSearch() != null && param != null) {
            for (SearchField sf : def.getSearch()) {
                String field = sf.getField().toLowerCase();
                Object value = getParamValue(param, sf.getField());
                if (value == null || value.toString().isEmpty()) continue;

                String widget = sf.getWidget();
                if ("dateRange".equals(widget)) {
                    Object from = getParamValue(param, sf.getField() + "_from");
                    Object to = getParamValue(param, sf.getField() + "_to");
                    if (from != null && !from.toString().isEmpty()) {
                        conditions.add(validateIdentifier(field) + " >= :" + field + "_from");
                    }
                    if (to != null && !to.toString().isEmpty()) {
                        conditions.add(validateIdentifier(field) + " <= :" + field + "_to");
                    }
                } else if ("text".equals(widget)) {
                    conditions.add(validateIdentifier(field) + " LIKE '%' || :" + field + " || '%'");
                } else {
                    conditions.add(validateIdentifier(field) + " = :" + field);
                }
            }
        }

        if (!conditions.isEmpty()) {
            sb.append(" WHERE ").append(String.join(" AND ", conditions));
        }

        if (orderBy != null && !orderBy.isEmpty()) {
            sb.append(" ORDER BY ").append(validateOrderBy(orderBy));
        }

        return sb.toString();
    }

    /**
     * Build named parameters map for a SELECT query.
     */
    private Map<String, Object> buildSelectParams(ScreenDefinition def, Map<String, Object> param) {
        Map<String, Object> params = new HashMap<>();

        // 모든 요청 파라미터를 소문자로 매핑 (where 절 바인딩용)
        if (param != null) {
            for (Map.Entry<String, Object> e : param.entrySet()) {
                params.put(e.getKey().toLowerCase(), e.getValue());
                params.put(e.getKey(), e.getValue());
            }
        }

        if (def.getSearch() != null && param != null) {
            for (SearchField sf : def.getSearch()) {
                String field = sf.getField().toLowerCase();
                Object value = getParamValue(param, sf.getField());
                if (value == null || value.toString().isEmpty()) continue;

                String widget = sf.getWidget();
                if ("dateRange".equals(widget)) {
                    Object from = getParamValue(param, sf.getField() + "_from");
                    Object to = getParamValue(param, sf.getField() + "_to");
                    if (from != null && !from.toString().isEmpty()) {
                        params.put(field + "_from", from.toString());
                    }
                    if (to != null && !to.toString().isEmpty()) {
                        params.put(field + "_to", to.toString());
                    }
                } else {
                    params.put(field, value.toString());
                }
            }
        }

        // 데이터 권한 주입
        Map<String, Object> authParams = DataAuthContext.get();
        if (authParams != null) {
            params.putAll(authParams);
        }

        return params;
    }

    private int toInt(Object val, int defaultVal) {
        if (val == null) return defaultVal;
        if (val instanceof Number) return ((Number) val).intValue();
        try { return Integer.parseInt(val.toString()); } catch (NumberFormatException e) { return defaultVal; }
    }

    // ==================== INSERT ====================

    @Transactional("txManagerPrimary")
    public void executeSave(ScreenDefinition def, String gridKey, List<Map<String, Object>> rows) {
        for (Map<String, Object> row : rows) {
            Map<String, Object> normalized = normalizeKeys(row);
            injectUserInfo(normalized);
            if (Constants.GSTAT_INSERT.equals(row.get(Constants.GSTAT))) {
                executeInsert(def, gridKey, normalized);
            } else {
                executeUpdate(def, gridKey, normalized);
            }
        }
    }

    private void executeInsert(ScreenDefinition def, String gridKey, Map<String, Object> data) {
        SqlDef sql = def.getSql();
        String table = validateIdentifier(resolveInsertTable(sql, gridKey));
        List<String> gridColumns = getGridColumnFields(def, gridKey);

        // 모든 그리드 컬럼에 대해 null 기본값 보장
        for (String col : gridColumns) {
            data.putIfAbsent(col, null);
        }

        // 그리드 컬럼 + 감사 컬럼
        List<String> insertCols = new ArrayList<>(gridColumns);
        insertCols.add("created_by");
        insertCols.add("created_at");
        insertCols.add("updated_by");
        insertCols.add("updated_at");

        List<String> values = new ArrayList<>();
        for (String col : gridColumns) {
            values.add(":" + col);
        }
        values.add(":user_id");
        values.add("NOW()");
        values.add(":user_id");
        values.add("NOW()");

        String sqlStr = "INSERT INTO " + table +
                " (" + insertCols.stream().map(this::validateIdentifier).collect(Collectors.joining(", ")) + ")" +
                " VALUES (" + String.join(", ", values) + ")";

        log.debug("[DynamicSQL] INSERT: {}", sqlStr);
        jdbc.update(sqlStr, data);
    }

    private void executeUpdate(ScreenDefinition def, String gridKey, Map<String, Object> data) {
        SqlDef sql = def.getSql();
        String table = validateIdentifier(resolveUpdateTable(sql, gridKey));
        String where = resolveUpdateWhere(sql, gridKey);
        List<String> gridColumns = getGridColumnFields(def, gridKey);

        for (String col : gridColumns) {
            data.putIfAbsent(col, null);
        }
        List<String> whereColumns = extractWhereColumns(where);

        // SET 절: WHERE 컬럼 제외
        List<String> setClauses = new ArrayList<>();
        for (String col : gridColumns) {
            if (!whereColumns.contains(col)) {
                setClauses.add(validateIdentifier(col) + " = :" + col);
            }
        }
        setClauses.add("updated_by = :user_id");
        setClauses.add("updated_at = NOW()");

        StringBuilder whereClause = new StringBuilder(convertWhereParams(where));

        // 낙관적 잠금: updated_at이 있으면 WHERE 조건에 추가
        if (data.containsKey("updated_at") && data.get("updated_at") != null) {
            data.put("_org_updated_at", data.get("updated_at"));
            whereClause.append(" AND updated_at = :_org_updated_at");
        }

        String sqlStr = "UPDATE " + table +
                " SET " + String.join(", ", setClauses) +
                " WHERE " + whereClause;

        log.debug("[DynamicSQL] UPDATE: {}", sqlStr);
        int affected = jdbc.update(sqlStr, data);
        if (affected == 0 && data.containsKey("_org_updated_at")) {
            throw new FormaException("데이터가 다른 사용자에 의해 변경되었습니다. 조회 후 다시 시도하세요.");
        }
    }

    // ==================== DELETE ====================

    @Transactional("txManagerPrimary")
    public void executeDelete(ScreenDefinition def, String gridKey, List<Map<String, Object>> rows) {
        SqlDef sql = def.getSql();
        String table = validateIdentifier(resolveDeleteTable(sql, gridKey));
        String where = resolveDeleteWhere(sql, gridKey);

        String sqlStr = "DELETE FROM " + table + " WHERE " + convertWhereParams(where);
        log.debug("[DynamicSQL] DELETE: {}", sqlStr);

        for (Map<String, Object> row : rows) {
            Map<String, Object> normalized = normalizeKeys(row);
            int affected = jdbc.update(sqlStr, normalized);
            log.debug("[DynamicSQL] DELETE affected: {}", affected);
        }
    }

    /**
     * 현재 로그인 사용자 정보를 파라미터에 주입
     */
    private void injectUserInfo(Map<String, Object> params) {
        try {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs == null) { params.putIfAbsent("user_id", "system"); return; }
            HttpServletRequest request = attrs.getRequest();
            LoginUserVo user = (LoginUserVo) request.getAttribute(Constants.LOGIN_USER_ATTR);
            if (user != null) {
                params.put("user_id", user.getUserId());
                params.put("user_name", user.getUserName());
                params.put("user_dept", user.getUserDeptCode());
                params.put("user_ip", user.getUserIp());
            } else {
                params.putIfAbsent("user_id", "system");
            }
        } catch (Exception e) {
            params.putIfAbsent("user_id", "system");
        }
    }

    // ==================== SQL 해석 유틸 ====================

    private String resolveTable(SqlDef sql, String action) {
        ScreenDefinition.SqlOp op = sql.getOperation(action);
        if (op != null && op.getTable() != null) return op.getTable();
        return sql.getDefaultTable() != null ? sql.getDefaultTable() : "unknown";
    }

    private String resolveColumns(SqlDef sql, String action) {
        ScreenDefinition.SqlOp op = sql.getOperation(action);
        if (op != null && op.getColumns() != null) return op.getColumns();
        return "*";
    }

    private String resolveOrderBy(SqlDef sql, String action) {
        ScreenDefinition.SqlOp op = sql.getOperation(action);
        return op != null ? op.getOrderBy() : null;
    }

    private String resolveInsertTable(SqlDef sql, String gridKey) {
        return resolveTable(sql, "insert" + capitalizeFirst(gridKey));
    }

    private String resolveUpdateTable(SqlDef sql, String gridKey) {
        return resolveTable(sql, "update" + capitalizeFirst(gridKey));
    }

    private String resolveUpdateWhere(SqlDef sql, String gridKey) {
        ScreenDefinition.SqlOp op = sql.getOperation("update" + capitalizeFirst(gridKey));
        return op != null && op.getWhere() != null ? op.getWhere() : "id = #{id}";
    }

    private String resolveDeleteTable(SqlDef sql, String gridKey) {
        return resolveTable(sql, "delete" + capitalizeFirst(gridKey));
    }

    private String resolveDeleteWhere(SqlDef sql, String gridKey) {
        ScreenDefinition.SqlOp op = sql.getOperation("delete" + capitalizeFirst(gridKey));
        return op != null && op.getWhere() != null ? op.getWhere() : resolveUpdateWhere(sql, gridKey);
    }

    private String capitalizeFirst(String s) {
        if (s == null || s.isEmpty()) return s;
        return s.substring(0, 1).toUpperCase() + s.substring(1);
    }

    private List<String> getGridColumnFields(ScreenDefinition def, String gridKey) {
        GridDef grid = def.getGrids() != null ? def.getGrids().get(gridKey) : null;
        if (grid == null || grid.getColumns() == null) return Collections.emptyList();
        return grid.getColumns().stream()
                .map(c -> c.getField().toLowerCase())
                .collect(Collectors.toList());
    }

    /**
     * #{xxx} → :xxx 변환
     */
    private String convertWhereParams(String where) {
        return where.replaceAll("#\\{(\\w+)}", ":$1");
    }

    /**
     * WHERE 절에서 컬럼명 추출
     */
    private List<String> extractWhereColumns(String where) {
        List<String> cols = new ArrayList<>();
        java.util.regex.Matcher m = Pattern.compile("#\\{(\\w+)}").matcher(where);
        while (m.find()) {
            cols.add(m.group(1));
        }
        return cols;
    }

    /**
     * Map 키를 모두 소문자로 변환 (ITEM_CD → item_cd)
     */
    private Map<String, Object> normalizeKeys(Map<String, Object> map) {
        Map<String, Object> result = new HashMap<>();
        for (Map.Entry<String, Object> e : map.entrySet()) {
            result.put(e.getKey().toLowerCase(), e.getValue());
        }
        return result;
    }

    /**
     * SQL 식별자 검증 (SQL injection 방지)
     */
    /**
     * 테이블 참조 검증 (tb_name alias 형태 지원)
     */
    private String validateTableRef(String tableRef) {
        if (tableRef == null) return "unknown";
        String[] parts = tableRef.trim().split("\\s+");
        StringBuilder sb = new StringBuilder(validateIdentifier(parts[0]));
        if (parts.length > 1) sb.append(" ").append(validateIdentifier(parts[1]));
        return sb.toString();
    }

    private String validateIdentifier(String identifier) {
        if (identifier == null || !SAFE_IDENTIFIER.matcher(identifier.trim()).matches()) {
            throw new IllegalArgumentException("Invalid SQL identifier: " + identifier);
        }
        return identifier.trim();
    }

    private String validateOrderBy(String orderBy) {
        // "item_grp, item_cd" → 각각 검증
        return Arrays.stream(orderBy.split(","))
                .map(String::trim)
                .map(part -> {
                    // "field desc" 형태 지원
                    String[] tokens = part.split("\\s+");
                    String col = validateIdentifier(tokens[0]);
                    if (tokens.length > 1) {
                        String dir = tokens[1].toUpperCase();
                        if ("ASC".equals(dir) || "DESC".equals(dir)) {
                            return col + " " + dir;
                        }
                    }
                    return col;
                })
                .collect(Collectors.joining(", "));
    }

    private Object getParamValue(Map<String, Object> param, String field) {
        // 대소문자 무관 검색
        Object val = param.get(field);
        if (val != null) return val;
        val = param.get(field.toLowerCase());
        if (val != null) return val;
        return param.get(field.toUpperCase());
    }
}
