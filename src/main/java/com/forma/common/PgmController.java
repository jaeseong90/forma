package com.forma.common;

import com.forma.frame.base.BaseResponse;
import com.forma.frame.mybatis.FormaSqlSession;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/pgm")
@RequiredArgsConstructor
public class PgmController {

    private final FormaSqlSession sql;

    @GetMapping("/{pgmId}/init")
    public BaseResponse<Map<String, Object>> init(@PathVariable String pgmId) {
        Map<String, Object> result = new HashMap<>();

        Map<String, Object> pgmInfo = sql.selectOne("pgm.selectPgmInfo", Map.of("pgm_id", pgmId));
        if (pgmInfo == null) {
            pgmInfo = defaultPgmInfo(pgmId);
        }

        Map<String, Object> pgmAuth = defaultPgmAuth();

        result.put("pgmInfo", pgmInfo);
        result.put("pgmAuth", pgmAuth);
        return BaseResponse.Ok(result);
    }

    private Map<String, Object> defaultPgmInfo(String pgmId) {
        Map<String, Object> info = new HashMap<>();
        info.put("pgm_id", pgmId);
        info.put("pgm_nm", pgmId);
        info.put("srch_yn", "Y");
        info.put("new_yn", "Y");
        info.put("save_yn", "Y");
        info.put("del_yn", "Y");
        info.put("prnt_yn", "N");
        info.put("upld_yn", "N");
        info.put("init_yn", "Y");
        return info;
    }

    private Map<String, Object> defaultPgmAuth() {
        Map<String, Object> auth = new HashMap<>();
        auth.put("srch_yn", "Y");
        auth.put("new_yn", "Y");
        auth.put("save_yn", "Y");
        auth.put("del_yn", "Y");
        auth.put("prnt_yn", "Y");
        auth.put("upld_yn", "Y");
        auth.put("init_yn", "Y");
        for (int i = 1; i <= 10; i++) auth.put("etc" + i + "_yn", "Y");
        return auth;
    }
}
