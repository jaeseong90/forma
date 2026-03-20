package com.forma.frame.audit;

import com.forma.frame.annotation.FormaService;
import com.forma.frame.util.Constants;
import com.forma.login.LoginUserVo;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.MDC;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;
import java.util.*;

/**
 * @FormaService의 save*, delete* 메서드를 감지하여 감사 로그를 자동 기록한다.
 */
@Slf4j
@Aspect
@Component
@Order(200) // ServiceTraceAspect 이후 실행
@RequiredArgsConstructor
public class AuditLogAspect {

    private final AuditLogService auditLogService;
    private static final ObjectMapper mapper = new ObjectMapper();

    // PK 후보 접미사
    private static final String[] PK_SUFFIXES = {"_cd", "_no", "_id", "_seq", "_code"};

    @Around("@within(formaService) && (execution(* save*(..)) || execution(* delete*(..)))")
    public Object audit(ProceedingJoinPoint pjp, FormaService formaService) throws Throwable {
        Object result = pjp.proceed();

        // 감사 로그 기록 (비동기적으로, 실패해도 비즈니스에 영향 없음)
        try {
            writeAuditLogs(pjp, formaService);
        } catch (Exception e) {
            log.debug("Audit log capture failed: {}", e.getMessage());
        }

        return result;
    }

    @SuppressWarnings("unchecked")
    private void writeAuditLogs(ProceedingJoinPoint pjp, FormaService formaService) {
        String methodName = pjp.getSignature().getName();
        String pgmId = formaService.pgmId();
        String traceId = MDC.get(Constants.MDC_TRACE_ID);
        LoginUserVo user = getLoginUser();
        String userId = user != null ? user.getUserId() : "system";
        String userIp = user != null ? user.getUserIp() : "";

        // namespace를 테이블명으로 사용 (sda010 → sda010)
        String tableName = pgmId.toLowerCase();

        for (Object arg : pjp.getArgs()) {
            if (arg instanceof List) {
                for (Object item : (List<?>) arg) {
                    if (item instanceof Map) {
                        writeOneAuditLog((Map<String, Object>) item, methodName, pgmId, tableName, traceId, userId, userIp);
                    }
                }
            } else if (arg instanceof Map) {
                writeOneAuditLog((Map<String, Object>) arg, methodName, pgmId, tableName, traceId, userId, userIp);
            }
        }
    }

    private void writeOneAuditLog(Map<String, Object> data, String methodName,
                                   String pgmId, String tableName,
                                   String traceId, String userId, String userIp) {
        String action = resolveAction(data, methodName);
        String rowKey = extractRowKey(data);

        AuditLogEntry.AuditLogEntryBuilder builder = AuditLogEntry.builder()
                .traceId(traceId)
                .pgmId(pgmId)
                .tableName(tableName)
                .action(action)
                .rowKey(rowKey)
                .userId(userId)
                .userIp(userIp);

        try {
            // 내부 필드(gstat, user_*) 제거 후 JSON 직렬화
            Map<String, Object> cleaned = new LinkedHashMap<>(data);
            cleaned.remove(Constants.GSTAT);
            cleaned.remove("user_id");
            cleaned.remove("user_name");
            cleaned.remove("user_dept");
            cleaned.remove("user_ip");

            String json = mapper.writeValueAsString(cleaned);

            if ("DELETE".equals(action)) {
                builder.beforeData(json);
            } else {
                builder.afterData(json);
            }
        } catch (Exception e) {
            log.debug("Audit JSON serialize failed: {}", e.getMessage());
        }

        auditLogService.writeAuditLog(builder.build());
    }

    private String resolveAction(Map<String, Object> data, String methodName) {
        if (methodName.startsWith("delete")) {
            return "DELETE";
        }
        String gstat = (String) data.get(Constants.GSTAT);
        if (Constants.GSTAT_INSERT.equals(gstat)) {
            return "INSERT";
        }
        return "UPDATE";
    }

    private String extractRowKey(Map<String, Object> data) {
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, Object> entry : data.entrySet()) {
            String key = entry.getKey().toLowerCase();
            for (String suffix : PK_SUFFIXES) {
                if (key.endsWith(suffix) && entry.getValue() != null) {
                    if (sb.length() > 0) sb.append(",");
                    sb.append(entry.getKey()).append("=").append(entry.getValue());
                    break;
                }
            }
        }
        return sb.length() > 0 ? sb.toString() : "(unknown)";
    }

    private LoginUserVo getLoginUser() {
        try {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs == null) return null;
            HttpServletRequest request = attrs.getRequest();
            return (LoginUserVo) request.getAttribute(Constants.LOGIN_USER_ATTR);
        } catch (Exception e) {
            return null;
        }
    }
}
