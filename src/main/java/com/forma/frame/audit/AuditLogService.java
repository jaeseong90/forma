package com.forma.frame.audit;

import com.forma.frame.mybatis.FormaSqlSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final FormaSqlSession sql;

    /**
     * 감사 로그 저장. 비즈니스 트랜잭션에 영향을 주지 않도록 예외를 삼킨다.
     */
    public void writeAuditLog(AuditLogEntry entry) {
        try {
            sql.insert("common.insertAuditLog", entry.toMap());
        } catch (Exception e) {
            log.warn("Audit log write failed: pgm={}, action={}, err={}",
                    entry.getPgmId(), entry.getAction(), e.getMessage());
        }
    }
}
