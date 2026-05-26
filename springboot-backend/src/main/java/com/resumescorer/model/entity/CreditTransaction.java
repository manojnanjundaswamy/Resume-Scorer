package com.resumescorer.model.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "credit_transactions")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CreditTransaction {
    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** Positive = added, negative = deducted */
    private int delta;

    /** e.g. "WELCOME_BONUS", "ANALYSIS", "TOPUP_10PACK" */
    private String reason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "analysis_id")
    private Analysis analysis;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;
}
