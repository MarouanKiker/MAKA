package com.maka.stock.core;

import org.springframework.security.oauth2.jwt.Jwt;

/**
 * Extraction des claims du JWT émis par auth-service (Lexik).
 * {@code sub} est l'email (user identifier Symfony) ; l'ID numérique est dans {@code user_id}.
 */
public final class JwtClaims {

    private JwtClaims() {}

    public static long userId(Jwt jwt) {
        if (jwt == null) {
            return 0L;
        }
        Object uid = jwt.getClaim("user_id");
        if (uid instanceof Number) {
            return ((Number) uid).longValue();
        }
        if (uid != null) {
            try {
                return Long.parseLong(uid.toString());
            } catch (NumberFormatException ignored) {
                // fall through
            }
        }
        Object sub = jwt.getClaim("sub");
        if (sub != null) {
            try {
                return Long.parseLong(sub.toString());
            } catch (NumberFormatException ignored) {
                // sub is often the email
            }
        }
        return 0L;
    }
}
