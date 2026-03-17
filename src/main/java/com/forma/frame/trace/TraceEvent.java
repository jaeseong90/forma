package com.forma.frame.trace;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TraceEvent {
    private String type;
    private String name;
    private String detail;
    private long elapsedMs;
    private long ts;
    private String traceId;
    private String pgmId;
    private String error;
}
