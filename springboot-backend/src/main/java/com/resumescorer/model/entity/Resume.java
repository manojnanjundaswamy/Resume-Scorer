package com.resumescorer.model.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "resumes")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Resume {
    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "original_name")
    private String fileName;
    @Column(name = "s3_key")
    private String s3Key;
    private long fileSizeBytes;

    @Column(nullable = false, updatable = false)
    private Instant uploadedAt;
}
