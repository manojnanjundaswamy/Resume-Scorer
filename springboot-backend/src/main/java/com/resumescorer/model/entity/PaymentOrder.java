package com.resumescorer.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "payment_orders", indexes = {
    @Index(name = "idx_payment_orders_user", columnList = "user_id"),
    @Index(name = "idx_payment_orders_status", columnList = "status"),
    @Index(name = "idx_payment_orders_razorpay_order", columnList = "razorpay_order_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentOrder {
    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, unique = true, length = 100)
    private String razorpayOrderId;

    @Column(length = 100)
    private String razorpayPaymentId;

    @Column(nullable = false)
    private int amountPaise;

    @Column(nullable = false)
    private int credits;

    @Column(nullable = false, length = 50)
    private String planId;

    @Column(nullable = false, length = 20)
    private String status; // CREATED, PAID, FAILED, REFUNDED

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    private Instant verifiedAt;
}
