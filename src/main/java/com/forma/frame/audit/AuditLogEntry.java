package com.forma.frame.audit;

import lombok.Builder;
import lombok.Data;

import java.util.HashMap;
import java.util.Map;

@Data
@Builder
public class AuditLogEntry {
    private String traceId;
    private String pgmId;
    private String tableName;
    private String action;      // INSERT, UPDATE, DELETE
    private String rowKey;
    private String beforeData;  // JSON
    private String afterData;   // JSON
    private String userId;
    private String userIp;

    public Map<String, Object> toMap() {
        Map<String, Object> map = new HashMap<>();
        map.put("trace_id", traceId);
        map.put("pgm_id", pgmId);
        map.put("table_name", tableName);
        map.put("action", action);
        map.put("row_key", rowKey);
        map.put("before_data", beforeData);
        map.put("after_data", afterData);
        map.put("user_id", userId);
        map.put("user_ip", userIp);
        return map;
    }
}
