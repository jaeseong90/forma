package com.forma.frame.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.Map;

@Slf4j
@Component
public class JwtTokenProvider {

    private final Key key;
    private final long validMillis;

    public JwtTokenProvider(
            @Value("${forma.jwt.secret}") String secret,
            @Value("${forma.jwt.valid-seconds}") long validSeconds) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.validMillis = validSeconds * 1000;
    }

    public String createToken(String userPk, Map<String, Object> claims) {
        Date now = new Date();
        return Jwts.builder()
                .setSubject(userPk)
                .addClaims(claims)
                .setIssuedAt(now)
                .setExpiration(new Date(now.getTime() + validMillis))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public String getUserPk(String token) {
        return Jwts.parserBuilder().setSigningKey(key).build()
                .parseClaimsJws(token).getBody().getSubject();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("Invalid JWT token: {}", e.getMessage());
            return false;
        }
    }

    public Map<String, Object> parseBody(String token) {
        Claims claims = Jwts.parserBuilder().setSigningKey(key).build()
                .parseClaimsJws(token).getBody();
        return claims;
    }

    /**
     * Returns the remaining validity time in milliseconds for the given token.
     */
    public long getRemainingMillis(String token) {
        Claims claims = Jwts.parserBuilder().setSigningKey(key).build()
                .parseClaimsJws(token).getBody();
        Date expiration = claims.getExpiration();
        return expiration.getTime() - System.currentTimeMillis();
    }

    public long getValidSeconds() {
        return validMillis / 1000;
    }
}
