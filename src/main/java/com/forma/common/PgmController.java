package com.forma.common;

import com.forma.frame.base.BaseResponse;
import com.forma.frame.mybatis.FormaSqlSession;
import com.forma.frame.screen.ScreenRegistry;
import com.forma.frame.screen.model.ScreenDefinition;
import com.forma.frame.util.Constants;
import com.forma.login.LoginUserVo;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pgm")
@RequiredArgsConstructor
public class PgmController {

    private final FormaSqlSession sql;
    private final ScreenRegistry screenRegistry;

    @GetMapping("/{pgmId}/init")
    public BaseResponse<Map<String, Object>> init(@PathVariable String pgmId, HttpServletRequest request) {
        Map<String, Object> result = new HashMap<>();

        // 1. PGM 정보
        Map<String, Object> pgmInfo = sql.selectOne("pgm.selectPgmInfo", Map.of("pgm_id", pgmId));
        if (pgmInfo == null && screenRegistry.hasDefinition(pgmId)) {
            pgmInfo = screenRegistry.getDefinition(pgmId).toPgmInfo();
        }
        if (pgmInfo == null) {
            pgmInfo = defaultPgmInfo(pgmId);
        }

        // 2. 권한 조회 — 로그인 사용자 기반
        Map<String, Object> pgmAuth;
        LoginUserVo user = (LoginUserVo) request.getAttribute(Constants.LOGIN_USER_ATTR);

        if (user != null && user.isAdmin()) {
            // 관리자: 전체 권한
            pgmAuth = fullAuth();
        } else if (user != null) {
            // 일반 사용자: 역할 기반 권한
            pgmAuth = sql.selectOne("login.selectPgmAuthByUser",
                    Map.of("user_id", user.getUserId(), "pgm_id", pgmId));
            if (pgmAuth == null) {
                pgmAuth = noAuth();
            }
        } else {
            // 비로그인: 기본 권한 (조회만)
            pgmAuth = noAuth();
        }

        result.put("pgmInfo", pgmInfo);
        result.put("pgmAuth", pgmAuth);
        return BaseResponse.Ok(result);
    }

    @GetMapping("/menus")
    public BaseResponse<List<Map<String, Object>>> menus(HttpServletRequest request) {
        LoginUserVo user = (LoginUserVo) request.getAttribute(Constants.LOGIN_USER_ATTR);
        if (user == null) {
            return BaseResponse.Warn("로그인이 필요합니다.");
        }

        List<Map<String, Object>> menus;
        if (user.isAdmin()) {
            menus = sql.selectList("login.selectMenusByUser", Map.of("user_id", user.getUserId()));
        } else {
            menus = sql.selectList("login.selectMenusByUser", Map.of("user_id", user.getUserId()));
        }
        return BaseResponse.Ok(menus);
    }

    private Map<String, Object> defaultPgmInfo(String pgmId) {
        Map<String, Object> info = new HashMap<>();
        info.put("PGM_ID", pgmId);
        info.put("PGM_NM", pgmId);
        info.put("SRCH_YN", "Y");
        info.put("NEW_YN", "Y");
        info.put("SAVE_YN", "Y");
        info.put("DEL_YN", "Y");
        info.put("PRNT_YN", "N");
        info.put("UPLD_YN", "N");
        info.put("INIT_YN", "Y");
        return info;
    }

    private Map<String, Object> fullAuth() {
        Map<String, Object> auth = new HashMap<>();
        auth.put("SRCH_YN", "Y");
        auth.put("NEW_YN", "Y");
        auth.put("SAVE_YN", "Y");
        auth.put("DEL_YN", "Y");
        auth.put("PRNT_YN", "Y");
        auth.put("UPLD_YN", "Y");
        auth.put("INIT_YN", "Y");
        return auth;
    }

    private Map<String, Object> noAuth() {
        Map<String, Object> auth = new HashMap<>();
        auth.put("SRCH_YN", "Y");
        auth.put("NEW_YN", "N");
        auth.put("SAVE_YN", "N");
        auth.put("DEL_YN", "N");
        auth.put("PRNT_YN", "N");
        auth.put("UPLD_YN", "N");
        auth.put("INIT_YN", "N");
        return auth;
    }
}
