package com.resumescorer.controller;

import com.resumescorer.model.entity.User;
import com.resumescorer.repository.UserRepository;
import com.resumescorer.security.AppleTokenVerifier;
import com.resumescorer.security.GoogleTokenVerifier;
import com.resumescorer.security.JwtTokenProvider;
import com.resumescorer.service.CreditService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final GoogleTokenVerifier googleVerifier;
    private final AppleTokenVerifier appleVerifier;
    private final UserRepository userRepository;
    private final CreditService creditService;
    private final JwtTokenProvider jwtProvider;

    /**
     * POST /api/auth/google
     * Body: { "idToken": "<Google ID token from mobile/web>" }
     * Returns: { "token": "<app JWT>", "user": {...} }
     */
    @PostMapping("/google")
    public ResponseEntity<Map<String, Object>> googleLogin(@RequestBody Map<String, String> body) {
        String idToken = body.get("idToken");
        if (idToken == null || idToken.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "idToken is required"));
        }

        GoogleTokenVerifier.GoogleUserInfo info = googleVerifier.verify(idToken);
        User user = findOrCreateUser(info.sub(), info.email(), info.name(), info.picture(), "GOOGLE");
        String jwt = jwtProvider.generateToken(user);

        log.info("Google login: user={} email={}", user.getId(), user.getEmail());
        return ResponseEntity.ok(Map.of("token", jwt, "user", userToMap(user)));
    }

    /**
     * POST /api/auth/apple
     * Body: { "identityToken": "<Apple identity token>", "fullName": "..." }
     * Returns: { "token": "<app JWT>", "user": {...} }
     */
    @PostMapping("/apple")
    public ResponseEntity<Map<String, Object>> appleLogin(@RequestBody Map<String, String> body) {
        String identityToken = body.get("identityToken");
        if (identityToken == null || identityToken.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "identityToken is required"));
        }

        AppleTokenVerifier.AppleUserInfo info = appleVerifier.verify(identityToken);
        String name = body.getOrDefault("fullName", info.email()); // Apple only sends name on first login
        User user = findOrCreateUser(info.sub(), info.email(), name, null, "APPLE");
        String jwt = jwtProvider.generateToken(user);

        log.info("Apple login: user={} email={}", user.getId(), user.getEmail());
        return ResponseEntity.ok(Map.of("token", jwt, "user", userToMap(user)));
    }

    // ── Private helpers ────────────────────────────────────

    private User findOrCreateUser(String externalId, String email, String name, String picture, String provider) {
        return userRepository.findByExternalId(externalId).orElseGet(() -> {
            log.info("Creating new user: email={} provider={}", email, provider);
            User newUser = User.builder()
                    .id(UUID.randomUUID())
                    .externalId(externalId)
                    .email(email)
                    .name(name)
                    .profilePictureUrl(picture)
                    .authProvider(provider)
                    .creditsRemaining(0)
                    .build();
            User saved = userRepository.save(newUser);
            creditService.grantWelcomeCredits(saved);
            return userRepository.findById(saved.getId()).orElse(saved);
        });
    }

    private Map<String, Object> userToMap(User u) {
        return Map.of(
            "id", u.getId(),
            "email", u.getEmail(),
            "name", u.getName() != null ? u.getName() : "",
            "creditsRemaining", u.getCreditsRemaining()
        );
    }
}
