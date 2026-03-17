package com.forma.frame.trace;

import com.forma.frame.util.Constants;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.MDC;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.UUID;

@Component
@Order(1)
public class TraceFilter implements Filter {

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest httpReq = (HttpServletRequest) req;
        String traceId = UUID.randomUUID().toString().substring(0, 8);
        String pgmId = httpReq.getHeader("X-Pgm-Id");
        if (pgmId == null) pgmId = httpReq.getParameter("pgmId");
        if (pgmId == null) pgmId = "";

        MDC.put(Constants.MDC_TRACE_ID, traceId);
        MDC.put(Constants.MDC_PGM_ID, pgmId);
        try {
            chain.doFilter(req, res);
        } finally {
            MDC.remove(Constants.MDC_TRACE_ID);
            MDC.remove(Constants.MDC_PGM_ID);
        }
    }
}
