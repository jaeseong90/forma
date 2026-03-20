package com.forma.frame.auth;

import java.util.Map;

/**
 * ThreadLocal 기반 데이터 권한 컨텍스트.
 * TokenInterceptor에서 set, afterCompletion에서 clear.
 */
public class DataAuthContext {

    private static final ThreadLocal<Map<String, Object>> CONTEXT = new ThreadLocal<>();

    private DataAuthContext() {}

    public static void set(Map<String, Object> authParams) {
        CONTEXT.set(authParams);
    }

    public static Map<String, Object> get() {
        return CONTEXT.get();
    }

    public static void clear() {
        CONTEXT.remove();
    }
}
