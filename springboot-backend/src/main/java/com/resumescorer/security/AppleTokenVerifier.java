package com.resumescorer.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import lombok.extern.slf4j.Slf4j;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import org.springframework.stereotype.Component;

import java.math.BigInteger;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.RSAPublicKeySpec;
import java.util.Base64;

/**
 * Verifies Apple Sign-In identity tokens using Apple's public keys.
 * Apple's public keys: https://appleid.apple.com/auth/keys
 */
@Slf4j
@Component
public class AppleTokenVerifier {

    private static final String APPLE_KEYS_URL = "https://appleid.apple.com/auth/keys";
    private static final String APPLE_ISSUER = "https://appleid.apple.com";

    private final OkHttpClient http = new OkHttpClient();
    private final ObjectMapper mapper = new ObjectMapper();

    public AppleUserInfo verify(String identityToken) {
        try {
            // Fetch Apple's current public keys
            JsonNode keys = fetchApplePublicKeys();

            // Decode the JWT header to find the key ID (kid)
            String[] parts = identityToken.split("\\.");
            String headerJson = new String(Base64.getUrlDecoder().decode(parts[0]));
            JsonNode header = mapper.readTree(headerJson);
            String kid = header.path("kid").asText();

            // Find the matching key
            PublicKey publicKey = findMatchingKey(keys, kid);

            // Verify and parse the token
            Claims claims = Jwts.parser()
                    .verifyWith(publicKey)
                    .requireIssuer(APPLE_ISSUER)
                    .build()
                    .parseSignedClaims(identityToken)
                    .getPayload();

            return new AppleUserInfo(claims.getSubject(), claims.get("email", String.class));
        } catch (Exception e) {
            log.error("Apple token verification failed", e);
            throw new RuntimeException("Apple authentication failed: " + e.getMessage(), e);
        }
    }

    private JsonNode fetchApplePublicKeys() throws Exception {
        Request request = new Request.Builder().url(APPLE_KEYS_URL).get().build();
        try (Response response = http.newCall(request).execute()) {
            String body = response.body() != null ? response.body().string() : "";
            return mapper.readTree(body).path("keys");
        }
    }

    private PublicKey findMatchingKey(JsonNode keys, String kid) throws Exception {
        for (JsonNode key : keys) {
            if (kid.equals(key.path("kid").asText())) {
                BigInteger n = new BigInteger(1, Base64.getUrlDecoder().decode(key.path("n").asText()));
                BigInteger e = new BigInteger(1, Base64.getUrlDecoder().decode(key.path("e").asText()));
                return KeyFactory.getInstance("RSA").generatePublic(new RSAPublicKeySpec(n, e));
            }
        }
        throw new RuntimeException("No Apple public key found for kid: " + kid);
    }

    public record AppleUserInfo(String sub, String email) {}
}
