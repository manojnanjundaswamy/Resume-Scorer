package com.resumescorer.controller;

import com.resumescorer.model.entity.User;
import com.resumescorer.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    /**
     * GET /api/users/me
     * Returns the authenticated user's profile and credit balance.
     */
    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getMe(@CurrentUser User user) {
        return ResponseEntity.ok(UserProfileResponse.from(user));
    }

    // ── Response DTO ─────────────────────────────────────────────────────────

    public record UserProfileResponse(
            UUID    id,
            String  email,
            String  name,
            String  profilePictureUrl,
            String  authProvider,
            int     creditsRemaining,
            Instant createdAt
    ) {
        static UserProfileResponse from(User u) {
            return new UserProfileResponse(
                    u.getId(),
                    u.getEmail(),
                    u.getName(),
                    u.getProfilePictureUrl(),
                    u.getAuthProvider(),
                    u.getCreditsRemaining(),
                    u.getCreatedAt()
            );
        }
    }
}
