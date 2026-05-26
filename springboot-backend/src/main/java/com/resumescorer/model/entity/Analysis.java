package com.resumescorer.model.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "analyses")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Analysis {
    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_id", nullable = false)
    private Resume resume;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private int overallScore;
    private String grade;

    /** Full result stored as JSONB for flexible querying */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String resultJson;

    private String aiProvider;
    private Integer tokensUsed;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;
}
