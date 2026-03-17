package com.forma.frame.log;

import com.forma.frame.mybatis.FormaSqlSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class FormaLogService {

    private final FormaSqlSession sql;

    public void insertLog(FormaLogType type, String pgmId, String userId, String userIp) {
        try {
            sql.insert("common.insertLog", Map.of(
                    "log_type", type.name(),
                    "pgm_id", pgmId,
                    "user_id", userId != null ? userId : "system",
                    "user_ip", userIp != null ? userIp : ""
            ));
        } catch (Exception e) {
            log.warn("Failed to insert log: {}", e.getMessage());
        }
    }
}
