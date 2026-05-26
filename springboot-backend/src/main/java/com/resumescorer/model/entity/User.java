package com.resumescorer.model.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "users")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class User {
    @Id
    private UUID id;

    @Column(unique = true, nullable = false)
    private String email;

    private String name;
    @Column(name = "profile_picture")
    private String profilePictureUrl;

    /** "GOOGLE" or "APPLE" */
    @Column(nullable = false)
    private String authProvider;

    /** The sub/subject from the OAuth token — unique per provider */
    @Column(nullable = false, unique = true)
    private String externalId;

    @Column(nullable = false)
    private int creditsRemaining;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = Instant.now();
    }
}
