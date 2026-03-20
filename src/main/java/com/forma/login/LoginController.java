package com.forma.login;

import com.forma.frame.base.BaseResponse;
import com.forma.frame.security.CookieUtil;
import com.forma.frame.security.JwtTokenProvider;
import com.forma.frame.util.Constants;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/login")
@RequiredArgsConstructor
public class LoginController {

    private final LoginService loginService;
    private final JwtTokenProvider jwtTokenProvider;

    @PostMapping("/loginProcess")
    public BaseResponse<?> loginProcess(@RequestBody Map<String, Object> param,
                                        HttpServletResponse response) {
        String userId = (String) param.get("userId");
        String password = (String) param.get("password");

        if (userId == null || userId.isEmpty()) {
            return BaseResponse.Warn("사용자 ID를 입력하세요.");
        }
        if (password == null) {
            password = "";
        }

        // 1. 사용자 조회
        Map<String, Object> userInfo = loginService.selectUserById(userId);
        if (userInfo == null) {
            return BaseResponse.Warn("등록되지 않은 사용자입니다.");
        }

        // 2. 사용 여부 체크
        if (!"Y".equals(userInfo.get("USE_YN"))) {
            return BaseResponse.Warn("비활성화된 계정입니다.");
        }

        // 3. 비밀번호 검증
        String storedPw = (String) userInfo.get("USER_PW");
        if (!loginService.checkPassword(password, storedPw)) {
            return BaseResponse.Warn("비밀번호가 올바르지 않습니다.");
        }

        // 4. JWT 토큰 생성
        Map<String, Object> claims = Map.of(
                "userId", userInfo.get("USER_ID"),
                "userName", userInfo.get("USER_NM"),
                "userDeptCode", userInfo.getOrDefault("DEPT_CODE", ""),
                "userDeptName", userInfo.getOrDefault("DEPT_NAME", ""),
                "admin", "Y".equals(userInfo.get("ADMIN_YN"))
        );
        String token = jwtTokenProvider.createToken(userId, claims);

        // 5. 쿠키 설정 (24시간)
        CookieUtil.addCookie(response, Constants.JWT_COOKIE_NAME, token, 86400);

        // 6. 로그인 로그
        loginService.insertLoginLog(userId, (String) param.getOrDefault("userIp", ""));

        log.info("Login success: userId={}", userId);
        return BaseResponse.Ok(Map.of(
                "userId", userInfo.get("USER_ID"),
                "userName", userInfo.get("USER_NM")
        ));
    }

    @GetMapping("/logout")
    public void logout(HttpServletResponse response) throws Exception {
        CookieUtil.removeCookie(response, Constants.JWT_COOKIE_NAME);
        response.sendRedirect("/login.html");
    }

    @GetMapping("/userInfo")
    public BaseResponse<?> userInfo(@RequestAttribute(Constants.LOGIN_USER_ATTR) LoginUserVo user) {
        return BaseResponse.Ok(Map.of(
                "userId", user.getUserId(),
                "userName", user.getUserName(),
                "deptCode", user.getUserDeptCode(),
                "deptName", user.getUserDeptName(),
                "admin", user.isAdmin()
        ));
    }
}
