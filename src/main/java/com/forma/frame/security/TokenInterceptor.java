package com.forma.frame.security;

import com.forma.frame.util.Constants;
import com.forma.login.LoginUserVo;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class TokenInterceptor implements HandlerInterceptor {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String token = CookieUtil.getCookieValue(request, Constants.JWT_COOKIE_NAME);
        if (token != null && jwtTokenProvider.validateToken(token)) {
            try {
                Map<String, Object> claims = jwtTokenProvider.parseBody(token);
                LoginUserVo user = new LoginUserVo();
                user.setUserId((String) claims.getOrDefault("userId", ""));
                user.setUserName((String) claims.getOrDefault("userName", ""));
                user.setUserDeptCode((String) claims.getOrDefault("userDeptCode", ""));
                user.setUserDeptName((String) claims.getOrDefault("userDeptName", ""));
                user.setUserIp(request.getRemoteAddr());
                user.setAdmin(Boolean.TRUE.equals(claims.get("admin")));
                request.setAttribute(Constants.LOGIN_USER_ATTR, user);
            } catch (Exception e) {
                log.warn("Failed to parse JWT claims", e);
            }
        }
        return true;
    }
}
