package com.forma.common;

import com.forma.frame.base.BaseController;
import com.forma.frame.base.BaseResponse;
import com.forma.frame.mybatis.FormaSqlSession;
import com.forma.frame.util.Constants;
import com.forma.login.LoginUserVo;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 즐겨찾기 + 개인 설정 API
 */
@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserSettingsController extends BaseController {

    private final FormaSqlSession sql;

    // ═══ 즐겨찾기 ═══

    @GetMapping("/favorites")
    public BaseResponse<List<Map<String, Object>>> getFavorites(HttpServletRequest request) {
        LoginUserVo user = getUser(request);
        if (user == null) return BaseResponse.Warn("로그인 필요");
        return BaseResponse.Ok(sql.selectList("userSettings.selectFavorites", Map.of("user_id", user.getUserId())));
    }

    @PostMapping("/favorites/add")
    public BaseResponse<?> addFavorite(@RequestBody Map<String, Object> param, HttpServletRequest request) {
        LoginUserVo user = getUser(request);
        if (user == null) return BaseResponse.Warn("로그인 필요");
        param.put("user_id", user.getUserId());

        // pgm_id가 전달된 경우 menu_id 조회
        if (param.get("pgm_id") != null && param.get("menu_id") == null) {
            Map<String, Object> menu = sql.selectOne("userSettings.selectMenuIdByPgmId", param);
            if (menu == null) return BaseResponse.Warn("메뉴를 찾을 수 없습니다.");
            param.put("menu_id", menu.get("MENU_ID"));
        }

        sql.insert("userSettings.insertFavorite", param);
        return BaseResponse.Ok();
    }

    @PostMapping("/favorites/remove")
    public BaseResponse<?> removeFavorite(@RequestBody Map<String, Object> param, HttpServletRequest request) {
        LoginUserVo user = getUser(request);
        if (user == null) return BaseResponse.Warn("로그인 필요");
        param.put("user_id", user.getUserId());
        sql.delete("userSettings.deleteFavorite", param);
        return BaseResponse.Ok();
    }

    // ═══ 개인 설정 ═══

    @GetMapping("/settings")
    public BaseResponse<Map<String, String>> getSettings(HttpServletRequest request) {
        LoginUserVo user = getUser(request);
        if (user == null) return BaseResponse.Warn("로그인 필요");
        List<Map<String, Object>> list = sql.selectList("userSettings.selectSettings",
                Map.of("user_id", user.getUserId()));
        Map<String, String> result = new HashMap<>();
        for (Map<String, Object> row : list) {
            result.put((String) row.get("SETTING_KEY"), (String) row.get("SETTING_VALUE"));
        }
        return BaseResponse.Ok(result);
    }

    @PostMapping("/settings")
    public BaseResponse<?> saveSettings(@RequestBody Map<String, String> param, HttpServletRequest request) {
        LoginUserVo user = getUser(request);
        if (user == null) return BaseResponse.Warn("로그인 필요");
        for (Map.Entry<String, String> entry : param.entrySet()) {
            Map<String, Object> row = new HashMap<>();
            row.put("user_id", user.getUserId());
            row.put("setting_key", entry.getKey());
            row.put("setting_value", entry.getValue());
            sql.delete("userSettings.deleteSetting", row);
            sql.insert("userSettings.insertSetting", row);
        }
        return BaseResponse.Ok();
    }

    private LoginUserVo getUser(HttpServletRequest request) {
        return (LoginUserVo) request.getAttribute(Constants.LOGIN_USER_ATTR);
    }
}
