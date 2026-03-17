package com.forma.frame.trace;

import org.springframework.stereotype.Component;

import java.util.concurrent.ConcurrentHashMap;

@Component
public class TraceToggleStore {

    private final ConcurrentHashMap<String, Boolean> toggles = new ConcurrentHashMap<>();

    public boolean isEnabled(String sessionId) {
        return Boolean.TRUE.equals(toggles.get(sessionId));
    }

    public void enable(String sessionId) {
        toggles.put(sessionId, true);
    }

    public void disable(String sessionId) {
        toggles.remove(sessionId);
    }
}
