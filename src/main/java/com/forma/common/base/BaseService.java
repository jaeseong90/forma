package com.forma.common.base;

import com.forma.common.model.PageResult;
import com.forma.common.util.AuthContext;
import com.forma.common.util.BusinessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.Set;

/**
 * 모든 Service의 베이스 클래스.
 * AI가 생성하는 Service는 이 클래스를 상속하고,
 * 추상 메서드만 구현하면 CRUD가 완성된다.
 *
 * AI 코드 생성 시 규칙:
 * - appendWhere()에 설계서의 search 조건을 구현
 * - 비즈니스 로직은 별도 메서드로 추가
 * - 마스터-디테일은 saveWithChildren() 패턴 사용
 * - lookup 필드가 있으면 joins()를 오버라이드
 */
public abstract class BaseService {

    protected abstract JdbcTemplate jdbc();
    protected abstract String table();
    protected abstract String pk();
    protected abstract String selectColumns();

    /** 검색조건 WHERE절 조립. 서브클래스가 오버라이드. */
    protected void appendWhere(StringBuilder sql, List<Object> params, Map<String, String> search) {
        // 기본: 아무 조건 없음. 서브클래스에서 오버라이드.
    }

    /** 기본 정렬. 서브클래스에서 오버라이드 가능. */
    protected String defaultSort() { return pk() + " DESC"; }

    /** 허용된 정렬 컬럼 목록. 서브클래스에서 오버라이드. null이면 sanitize 방식 사용. */
    protected Set<String> sortableColumns() { return null; }

    /** 감사 필드 자동 세팅 여부. 서브클래스에서 false로 오버라이드 가능. */
    protected boolean audit() { return true; }

    /**
     * LEFT JOIN 정의. 서브클래스에서 오버라이드.
     * 반환 형식: { "tb_customer c ON t.cust_cd = c.cust_cd", ... }
     */
    protected String[] joins() { return null; }

    /** 저장 전 검증 훅. 서브클래스에서 오버라이드하여 비즈니스 검증 추가. */
    protected void validateBeforeSave(Map<String, Object> data) {
        // 기본: 검증 없음
    }

    // ==================== FROM절 조립 ====================

    private String buildFrom() {
        StringBuilder from = new StringBuilder(table() + " t");
        String[] joinDefs = joins();
        if (joinDefs != null) {
            for (String j : joinDefs) {
                from.append(" LEFT JOIN ").append(j);
            }
        }
        return from.toString();
    }

    // ==================== LIST ====================

    public PageResult<Map<String, Object>> list(Map<String, String> search) {
        int page = Integer.parseInt(search.getOrDefault("_page", "1"));
        int size = Integer.parseInt(search.getOrDefault("_size", "50"));
        String sort = validateSort(search.getOrDefault("_sort", defaultSort()));
        String from = buildFrom();

        // COUNT
        StringBuilder countSql = new StringBuilder("SELECT COUNT(*) FROM " + from + " WHERE 1=1");
        List<Object> countParams = new ArrayList<>();
        appendWhere(countSql, countParams, search);
        Integer total = jdbc().queryForObject(countSql.toString(), Integer.class, countParams.toArray());

        // SELECT
        StringBuilder sql = new StringBuilder("SELECT " + selectColumns() + " FROM " + from + " WHERE 1=1");
        List<Object> params = new ArrayList<>();
        appendWhere(sql, params, search);
        sql.append(" ORDER BY ").append(sanitize(sort));
        sql.append(" LIMIT ? OFFSET ?");
        params.add(size);
        params.add((page - 1) * size);

        List<Map<String, Object>> rows = jdbc().queryForList(sql.toString(), params.toArray());
        return PageResult.of(toLowerKeys(rows), total != null ? total : 0, page, size);
    }

    // ==================== GET ====================

    public Map<String, Object> get(Object id) {
        String from = buildFrom();
        String sql = "SELECT " + selectColumns() + " FROM " + from + " WHERE t." + pk() + " = ?";
        List<Map<String, Object>> rows = jdbc().queryForList(sql, id);
        if (rows.isEmpty()) throw new BusinessException("데이터를 찾을 수 없습니다: " + id);
        return toLowerKey(rows.get(0));
    }

    // ==================== SAVE (Insert or Update) ====================

    @Transactional
    public Map<String, Object> save(Map<String, Object> data) {
        validateBeforeSave(data);

        Object pkVal = data.get(pk());
        boolean isNew = (pkVal == null || pkVal.toString().isBlank() || !exists(pkVal));

        if (audit()) {
            String now = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
            String user = AuthContext.getCurrentUser();
            if (isNew) {
                data.putIfAbsent("created_by", user);
                data.putIfAbsent("created_at", now);
            }
            data.put("updated_by", user);
            data.put("updated_at", now);
        }

        if (isNew) {
            return doInsert(data);
        } else {
            return doUpdate(data);
        }
    }

    protected Map<String, Object> doInsert(Map<String, Object> data) {
        List<String> cols = new ArrayList<>();
        List<String> holders = new ArrayList<>();
        List<Object> params = new ArrayList<>();

        for (Map.Entry<String, Object> e : data.entrySet()) {
            if (e.getValue() == null) continue;
            cols.add(e.getKey());
            holders.add("?");
            params.add(e.getValue());
        }

        String sql = String.format("INSERT INTO %s (%s) VALUES (%s)",
                table(), String.join(",", cols), String.join(",", holders));
        jdbc().update(sql, params.toArray());
        return Map.of("success", true, "id", data.get(pk()));
    }

    protected Map<String, Object> doUpdate(Map<String, Object> data) {
        List<String> sets = new ArrayList<>();
        List<Object> params = new ArrayList<>();

        for (Map.Entry<String, Object> e : data.entrySet()) {
            if (e.getKey().equals(pk())) continue;
            sets.add(e.getKey() + " = ?");
            params.add(e.getValue());
        }
        params.add(data.get(pk()));

        String sql = String.format("UPDATE %s SET %s WHERE %s = ?",
                table(), String.join(", ", sets), pk());
        jdbc().update(sql, params.toArray());
        return Map.of("success", true, "id", data.get(pk()));
    }

    // ==================== DELETE ====================

    @Transactional
    public void delete(Object id) {
        if (!exists(id)) throw new BusinessException("삭제할 데이터가 없습니다: " + id);
        jdbc().update("DELETE FROM " + table() + " WHERE " + pk() + " = ?", id);
    }

    // ==================== CHILDREN (마스터-디테일) ====================

    /**
     * 자식 테이블 전체 삭제 후 재입력 패턴.
     * AI가 master-detail 화면에서 사용하는 공통 패턴.
     */
    protected void replaceChildren(String childTable, String fkColumn, Object fkValue,
                                    List<Map<String, Object>> children) {
        jdbc().update("DELETE FROM " + childTable + " WHERE " + fkColumn + " = ?", fkValue);
        int seq = 1;
        for (Map<String, Object> row : children) {
            row.put(fkColumn, fkValue);
            row.put("seq", seq++);
            insertChild(childTable, row);
        }
    }

    /**
     * Merge 방식 자식 저장 패턴.
     * 프론트에서 각 행의 _status: "C"(신규), "U"(수정), "D"(삭제)를 전달한다.
     */
    protected void mergeChildren(String childTable, String pkColumn,
                                  List<Map<String, Object>> children) {
        for (Map<String, Object> row : children) {
            String status = String.valueOf(row.remove("_status"));
            switch (status) {
                case "C" -> insertChild(childTable, row);
                case "U" -> updateChild(childTable, pkColumn, row);
                case "D" -> {
                    Object id = row.get(pkColumn);
                    if (id != null) {
                        jdbc().update("DELETE FROM " + childTable + " WHERE " + pkColumn + " = ?", id);
                    }
                }
                default -> {} // 변경 없는 행은 무시
            }
        }
    }

    protected void insertChild(String childTable, Map<String, Object> data) {
        List<String> cols = new ArrayList<>();
        List<String> holders = new ArrayList<>();
        List<Object> params = new ArrayList<>();

        for (Map.Entry<String, Object> e : data.entrySet()) {
            if (e.getValue() == null) continue;
            cols.add(e.getKey());
            holders.add("?");
            params.add(e.getValue());
        }

        String sql = String.format("INSERT INTO %s (%s) VALUES (%s)",
                childTable, String.join(",", cols), String.join(",", holders));
        jdbc().update(sql, params.toArray());
    }

    protected void updateChild(String childTable, String pkColumn, Map<String, Object> data) {
        List<String> sets = new ArrayList<>();
        List<Object> params = new ArrayList<>();

        for (Map.Entry<String, Object> e : data.entrySet()) {
            if (e.getKey().equals(pkColumn)) continue;
            sets.add(e.getKey() + " = ?");
            params.add(e.getValue());
        }
        params.add(data.get(pkColumn));

        String sql = String.format("UPDATE %s SET %s WHERE %s = ?",
                childTable, String.join(", ", sets), pkColumn);
        jdbc().update(sql, params.toArray());
    }

    // ==================== UTIL ====================

    protected boolean exists(Object id) {
        Integer cnt = jdbc().queryForObject(
                "SELECT COUNT(*) FROM " + table() + " WHERE " + pk() + " = ?",
                Integer.class, id);
        return cnt != null && cnt > 0;
    }

    /** sort 파라미터를 화이트리스트 방식으로 검증 */
    private String validateSort(String sort) {
        if (sort == null || sort.isBlank()) return defaultSort();
        String sanitized = sanitize(sort).trim();
        // "field ASC" 또는 "field DESC" 형식 파싱
        String[] parts = sanitized.split("\\s+");
        String field = parts[0].replace("t.", "");
        String dir = parts.length > 1 && parts[1].equalsIgnoreCase("DESC") ? "DESC" : "ASC";

        Set<String> allowed = sortableColumns();
        if (allowed != null && !allowed.isEmpty()) {
            if (!allowed.contains(field.toLowerCase())) return defaultSort();
        }
        return field + " " + dir;
    }

    /** Map 키를 전부 소문자로 변환 (H2 대문자 컬럼명 대응) */
    private Map<String, Object> toLowerKey(Map<String, Object> map) {
        Map<String, Object> result = new LinkedHashMap<>();
        for (Map.Entry<String, Object> e : map.entrySet()) {
            result.put(e.getKey().toLowerCase(), e.getValue());
        }
        return result;
    }

    private List<Map<String, Object>> toLowerKeys(List<Map<String, Object>> rows) {
        List<Map<String, Object>> result = new ArrayList<>(rows.size());
        for (Map<String, Object> row : rows) {
            result.add(toLowerKey(row));
        }
        return result;
    }

    private String sanitize(String sort) {
        return sort.replaceAll("[^a-zA-Z0-9_ ,.]", "");
    }
}
