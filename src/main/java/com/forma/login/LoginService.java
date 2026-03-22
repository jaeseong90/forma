package com.forma.login;

import com.forma.frame.mybatis.FormaSqlSession;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class LoginService {

    private final FormaSqlSession sql;
    private final PasswordEncoder passwordEncoder;

    private final String ns = "login";

    /**
     * 사용자 조회
     */
    public Map<String, Object> selectUserById(String userId) {
        return sql.selectOne(ns + ".selectUserById", Map.of("user_id", userId));
    }

    /**
     * 비밀번호 검증
     * - 빈 비밀번호(개발모드): 항상 통과
     * - BCrypt 해시: passwordEncoder.matches()
     * - 평문(레거시): 직접 비교
     */
    public boolean checkPassword(String rawPassword, String storedPassword) {
        // 개발 모드: 저장된 비밀번호가 비어있으면 통과
        if (storedPassword == null || storedPassword.isEmpty()) {
            return true;
        }
        // BCrypt 해시인 경우
        if (storedPassword.startsWith("$2")) {
            return passwordEncoder.matches(rawPassword, storedPassword);
        }
        // 평문 비교 (레거시 호환)
        return rawPassword.equals(storedPassword);
    }

    /**
     * 비밀번호 암호화
     */
    public String encodePassword(String rawPassword) {
        return passwordEncoder.encode(rawPassword);
    }

    /**
     * 비밀번호 변경
     */
    public void updatePassword(String userId, String encodedPassword) {
        sql.update(ns + ".updatePassword", Map.of("user_id", userId, "user_pw", encodedPassword));
    }

    /**
     * 로그인 로그 저장
     */
    public void insertLoginLog(String userId, String userIp) {
        sql.insert("common.insertLog", Map.of(
                "log_type", "LOGIN",
                "pgm_id", "LOGIN",
                "user_id", userId,
                "user_ip", userIp
        ));
    }
}
