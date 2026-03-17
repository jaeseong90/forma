package com.forma.common.util;

import java.util.Collections;
import java.util.Set;

/**
 * ThreadLocal 기반 현재 사용자 정보 관리.
 * 인증 필터에서 set(), 요청 완료 시 clear()를 호출한다.
 * 인증 미구현 상태에서는 "system"으로 동작.
 */
public class AuthContext {

    private static final ThreadLocal<UserInfo> current = new ThreadLocal<>();

    public static void set(UserInfo user) {
        current.set(user);
    }

    public static UserInfo get() {
        return current.get();
    }

    public static void clear() {
        current.remove();
    }

    public static String getCurrentUser() {
        UserInfo user = current.get();
        return user != null ? user.getUserId() : "system";
    }

    public static boolean hasRole(String role) {
        UserInfo user = current.get();
        return user != null && user.getRoles().contains(role);
    }

    /**
     * 현재 사용자 정보 DTO.
     */
    public static class UserInfo {
        private String userId;
        private String userName;
        private Set<String> roles;

        public UserInfo(String userId, String userName, Set<String> roles) {
            this.userId = userId;
            this.userName = userName;
            this.roles = roles != null ? roles : Collections.emptySet();
        }

        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        public String getUserName() { return userName; }
        public void setUserName(String userName) { this.userName = userName; }
        public Set<String> getRoles() { return roles; }
        public void setRoles(Set<String> roles) { this.roles = roles; }
    }
}
