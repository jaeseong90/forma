package com.forma.frame.trace;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;

@Component
public class TraceStore {

    private static final int MAX_SIZE = 300;
    private final LinkedList<TraceEvent> events = new LinkedList<>();

    public synchronized void add(TraceEvent event) {
        events.addFirst(event);
        while (events.size() > MAX_SIZE) {
            events.removeLast();
        }
    }

    public synchronized List<TraceEvent> getRecent(int count) {
        return new ArrayList<>(events.subList(0, Math.min(count, events.size())));
    }

    public synchronized void clear() {
        events.clear();
    }
}
