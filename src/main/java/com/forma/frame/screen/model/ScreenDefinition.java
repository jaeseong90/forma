package com.forma.frame.screen.model;

import com.fasterxml.jackson.annotation.JsonAnySetter;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.util.*;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class ScreenDefinition {

    private ScreenInfo screen;
    private Map<String, Boolean> auth;
    private List<SearchField> search;
    private Map<String, GridDef> grids;
    private LayoutDef layout;
    private SqlDef sql;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ScreenInfo {
        private String id;
        private String name;
        private String module;
        private String type;
        private String description;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class SearchField {
        private String field;
        private String label;
        private String widget = "text";
        private String code;
        private String placeholder;
        private Object defaultValue;
        private List<Map<String, Object>> options;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class GridDef {
        private boolean editable;
        private boolean checkable;
        private boolean sortable;
        private boolean rowNum;
        private boolean paging;
        private int pageSize = 50;
        private List<ColumnDef> columns;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ColumnDef {
        private String field;
        private String label;
        private int width = 100;
        private String type;
        private String format;
        private String editor;
        private String code;
        private boolean required;
        private boolean readOnly;
        private String align;
        private List<Map<String, Object>> options;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class LayoutDef {
        private String type = "full";
        private int splitWidth = 400;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class SqlDef {
        private List<Map<String, String>> tables;
        // 동적 키 (selectGrid1, insertGrid1, ...) → SqlOp 매핑
        private Map<String, SqlOp> operations = new LinkedHashMap<>();

        @JsonAnySetter
        public void setDynamicProperty(String key, Object value) {
            if (value instanceof Map) {
                SqlOp op = new SqlOp();
                @SuppressWarnings("unchecked")
                Map<String, Object> map = (Map<String, Object>) value;
                op.setTable((String) map.get("table"));
                op.setColumns((String) map.get("columns"));
                op.setOrderBy((String) map.get("orderBy"));
                op.setWhere((String) map.get("where"));
                operations.put(key, op);
            }
        }

        public SqlOp getOperation(String name) {
            return operations.get(name);
        }

        public String getDefaultTable() {
            if (tables != null && !tables.isEmpty()) {
                return tables.get(0).get("name");
            }
            return null;
        }
    }

    @Data
    public static class SqlOp {
        private String table;
        private String columns;
        private String orderBy;
        private String where;
    }

    public Map<String, Object> toPgmInfo() {
        Map<String, Object> info = new HashMap<>();
        info.put("PGM_ID", screen.getId());
        info.put("PGM_NM", screen.getName());
        info.put("SRCH_YN", authFlag("search"));
        info.put("NEW_YN", authFlag("new"));
        info.put("SAVE_YN", authFlag("save"));
        info.put("DEL_YN", authFlag("delete"));
        info.put("INIT_YN", authFlag("init"));
        info.put("PRNT_YN", authFlag("print"));
        info.put("UPLD_YN", authFlag("upload"));
        return info;
    }

    private String authFlag(String key) {
        return auth != null && Boolean.TRUE.equals(auth.get(key)) ? "Y" : "N";
    }
}
