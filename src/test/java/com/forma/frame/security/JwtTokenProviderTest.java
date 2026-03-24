package com.forma.frame.security;

import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * JwtTokenProvider 단위 테스트.
 * - 토큰 생성/검증/파싱/만료
 */
class JwtTokenProviderTest {

    private static final String SECRET = "formaDefaultSecretKeyForDevelopmentOnly1234567890abcdef";

    private JwtTokenProvider provider;

    @BeforeEach
    void setUp() {
        provider = new JwtTokenProvider(SECRET, 86400);
    }

    // ═══ createToken ═══

    @Test
    @DisplayName("토큰 생성 - 정상")
    void createToken_success() {
        Map<String, Object> claims = Map.of("userName", "관리자", "admin", true);
        String token = provider.createToken("admin", claims);

        assertNotNull(token);
        assertFalse(token.isEmpty());
        // JWT는 3파트 (header.payload.signature)
        assertEquals(3, token.split("\\.").length);
    }

    @Test
    @DisplayName("토큰 생성 - 빈 claims")
    void createToken_emptyClaims() {
        String token = provider.createToken("user01", new HashMap<>());
        assertNotNull(token);
        assertEquals("user01", provider.getUserPk(token));
    }

    // ═══ getUserPk ═══

    @Test
    @DisplayName("getUserPk - subject 추출")
    void getUserPk_success() {
        String token = provider.createToken("admin", Map.of());
        assertEquals("admin", provider.getUserPk(token));
    }

    @Test
    @DisplayName("getUserPk - 다른 사용자")
    void getUserPk_differentUsers() {
        String t1 = provider.createToken("user01", Map.of());
        String t2 = provider.createToken("user02", Map.of());

        assertEquals("user01", provider.getUserPk(t1));
        assertEquals("user02", provider.getUserPk(t2));
    }

    // ═══ validateToken ═══

    @Test
    @DisplayName("validateToken - 유효한 토큰")
    void validateToken_valid() {
        String token = provider.createToken("admin", Map.of());
        assertTrue(provider.validateToken(token));
    }

    @Test
    @DisplayName("validateToken - 변조된 토큰")
    void validateToken_tampered() {
        String token = provider.createToken("admin", Map.of());
        // signature 부분 변조
        String tampered = token.substring(0, token.lastIndexOf('.') + 1) + "invalid_signature";
        assertFalse(provider.validateToken(tampered));
    }

    @Test
    @DisplayName("validateToken - 빈 문자열")
    void validateToken_empty() {
        assertFalse(provider.validateToken(""));
    }

    @Test
    @DisplayName("validateToken - null")
    void validateToken_null() {
        assertFalse(provider.validateToken(null));
    }

    @Test
    @DisplayName("validateToken - 다른 secret으로 서명된 토큰")
    void validateToken_wrongSecret() {
        JwtTokenProvider other = new JwtTokenProvider(
                "anotherSecretKeyThatIsDifferentFromTheOriginal123456", 86400);
        String otherToken = other.createToken("admin", Map.of());
        assertFalse(provider.validateToken(otherToken));
    }

    @Test
    @DisplayName("validateToken - 만료된 토큰")
    void validateToken_expired() {
        // validSeconds = 0 → 즉시 만료
        JwtTokenProvider shortLived = new JwtTokenProvider(SECRET, 0);
        String token = shortLived.createToken("admin", Map.of());
        assertFalse(shortLived.validateToken(token));
    }

    // ═══ parseBody ═══

    @Test
    @DisplayName("parseBody - claims 추출")
    void parseBody_success() {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userName", "관리자");
        claims.put("deptCode", "D001");
        String token = provider.createToken("admin", claims);

        Map<String, Object> body = provider.parseBody(token);
        assertEquals("admin", body.get("sub"));
        assertEquals("관리자", body.get("userName"));
        assertEquals("D001", body.get("deptCode"));
    }

    @Test
    @DisplayName("parseBody - 변조된 토큰 → 예외")
    void parseBody_tampered_throwsException() {
        assertThrows(JwtException.class, () -> provider.parseBody("invalid.token.here"));
    }

    // ═══ getRemainingMillis ═══

    @Test
    @DisplayName("getRemainingMillis - 유효 토큰 → 양수")
    void getRemainingMillis_valid() {
        String token = provider.createToken("admin", Map.of());
        long remaining = provider.getRemainingMillis(token);
        assertTrue(remaining > 0);
        // 86400초 (24시간) 이내
        assertTrue(remaining <= 86400 * 1000L);
    }

    // ═══ getValidSeconds ═══

    @Test
    @DisplayName("getValidSeconds - 설정값 반환")
    void getValidSeconds_returnsConfigured() {
        assertEquals(86400, provider.getValidSeconds());
    }

    @Test
    @DisplayName("getValidSeconds - 다른 설정값")
    void getValidSeconds_customValue() {
        JwtTokenProvider custom = new JwtTokenProvider(SECRET, 3600);
        assertEquals(3600, custom.getValidSeconds());
    }

    // ═══ 동일 userPk → 다른 토큰 ═══

    @Test
    @DisplayName("동일 사용자로 생성한 토큰은 timestamp 차이로 다를 수 있음")
    void createToken_sameUser_differentTokens() {
        String t1 = provider.createToken("admin", Map.of());
        String t2 = provider.createToken("admin", Map.of());
        // issuedAt이 같은 밀리초일 수 있으므로 동일할 수도 있음 - 검증은 둘 다 유효한지
        assertTrue(provider.validateToken(t1));
        assertTrue(provider.validateToken(t2));
    }
}
