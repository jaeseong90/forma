package com.forma.frame.security;

import com.forma.frame.auth.DataAuthContext;
import com.forma.frame.auth.DataAuthService;
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
    private final DataAuthService dataAuthService;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String token = CookieUtil.getCookieValue(request, Constants.JWT_COOKIE_NAME);

        if (token == null || token.isEmpty()) {
            return handleAuthError(request, response, "token_missing");
        }

        if (!jwtTokenProvider.validateToken(token)) {
            return handleAuthError(request, response, "token_expired");
        }

        try {
            Map<String, Object> claims = jwtTokenProvider.parseBody(token);
            LoginUserVo user = new LoginUserVo();
            user.setUserId((String) claims.getOrDefault("userId", ""));
            user.setUserName((String) claims.getOrDefault("userName", ""));
            user.setUserDeptCode((String) claims.getOrDefault("userDeptCode", ""));
            user.setUserDeptName((String) claims.getOrDefault("userDeptName", ""));
            user.setAdmin(Boolean.TRUE.equals(claims.get("admin")));
            user.setUserIp(request.getRemoteAddr());
            request.setAttribute(Constants.LOGIN_USER_ATTR, user);

            // 데이터 권한 컨텍스트 설정
            Map<String, Object> authParams = dataAuthService.buildAuthParams(user);
            DataAuthContext.set(authParams);

            return true;
        } catch (Exception e) {
            log.warn("Failed to parse JWT claims", e);
            return handleAuthError(request, response, "token_expired");
        }
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        DataAuthContext.clear();
    }

    private boolean handleAuthError(HttpServletRequest request, HttpServletResponse response, String errorCode) throws Exception {
        response.setHeader("error", errorCode);

        if (isAjaxRequest(request)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        } else {
            response.sendRedirect("/login.html?error=" + errorCode);
        }
        return false;
    }

    private boolean isAjaxRequest(HttpServletRequest request) {
        String accept = request.getHeader("Accept");
        String xRequested = request.getHeader("X-Requested-With");
        String contentType = request.getHeader("Content-Type");
        return "XMLHttpRequest".equals(xRequested)
                || (accept != null && accept.contains("application/json"))
                || (contentType != null && contentType.contains("application/json"));
    }
}
