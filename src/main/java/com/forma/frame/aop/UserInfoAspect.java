package com.forma.frame.aop;

import com.forma.frame.util.Constants;
import com.forma.login.LoginUserVo;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.List;
import java.util.Map;

@Slf4j
@Aspect
@Component
public class UserInfoAspect {

    @Before("@annotation(com.forma.frame.annotation.AddUserInfo)")
    public void addUserInfo(JoinPoint joinPoint) {
        LoginUserVo user = getLoginUser();
        if (user == null) {
            user = LoginUserVo.systemUser();
        }

        for (Object arg : joinPoint.getArgs()) {
            injectUserInfo(arg, user);
        }
    }

    @SuppressWarnings("unchecked")
    private void injectUserInfo(Object target, LoginUserVo user) {
        if (target instanceof Map) {
            Map<String, Object> map = (Map<String, Object>) target;
            map.put("user_id", user.getUserId());
            map.put("user_name", user.getUserName());
            map.put("user_dept", user.getUserDeptCode());
            map.put("user_ip", user.getUserIp());
        } else if (target instanceof List<?> list) {
            for (Object item : list) {
                injectUserInfo(item, user);
            }
        }
    }

    private LoginUserVo getLoginUser() {
        try {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs == null) return null;
            HttpServletRequest request = attrs.getRequest();
            return (LoginUserVo) request.getAttribute(Constants.LOGIN_USER_ATTR);
        } catch (Exception e) {
            return null;
        }
    }
}
