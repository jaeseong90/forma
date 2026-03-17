package com.forma.frame.trace;

import com.forma.frame.annotation.FormaService;
import com.forma.frame.util.Constants;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;

@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class ServiceTraceAspect {

    private final TraceStore traceStore;

    @Around("@within(formaService)")
    public Object trace(ProceedingJoinPoint pjp, FormaService formaService) throws Throwable {
        String methodName = pjp.getSignature().toShortString();
        long start = System.currentTimeMillis();
        String error = null;

        try {
            return pjp.proceed();
        } catch (Throwable t) {
            error = t.getMessage();
            throw t;
        } finally {
            long elapsed = System.currentTimeMillis() - start;
            TraceEvent event = TraceEvent.builder()
                    .type("SERVICE")
                    .name(methodName)
                    .detail(formaService.description())
                    .elapsedMs(elapsed)
                    .ts(System.currentTimeMillis())
                    .traceId(MDC.get(Constants.MDC_TRACE_ID))
                    .pgmId(formaService.pgmId())
                    .error(error)
                    .build();
            traceStore.add(event);

            if (elapsed > 1000) {
                log.warn("[SLOW] {} {}ms pgm={}", methodName, elapsed, formaService.pgmId());
            } else {
                log.debug("[TRACE] {} {}ms pgm={}", methodName, elapsed, formaService.pgmId());
            }
        }
    }
}
