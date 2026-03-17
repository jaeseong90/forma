package com.forma.frame.trace;

import com.forma.frame.base.BaseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trace")
@RequiredArgsConstructor
public class TraceController {

    private final TraceStore traceStore;

    @GetMapping("/recent")
    public BaseResponse<List<TraceEvent>> recent(
            @RequestParam(defaultValue = "50") int count) {
        return BaseResponse.Ok(traceStore.getRecent(count));
    }

    @DeleteMapping("/clear")
    public BaseResponse<Void> clear() {
        traceStore.clear();
        return BaseResponse.Ok();
    }
}
