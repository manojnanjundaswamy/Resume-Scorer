package com.resumescorer.controller;

import com.resumescorer.model.entity.User;
import com.resumescorer.security.CurrentUser;
import com.resumescorer.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    /**
     * GET /api/payment/plans
     * Returns all available payment plans (public endpoint).
     */
    @GetMapping("/plans")
    public ResponseEntity<List<Map<String, Object>>> getPlans() {
        return ResponseEntity.ok(paymentService.getPlans());
    }

    /**
     * POST /api/payment/create-order
     * Creates a Razorpay order for the given plan.
     * Body: { "planId": "starter_pack" }
     */
    @PostMapping("/create-order")
    public ResponseEntity<Map<String, Object>> createOrder(
        @CurrentUser User user,
        @RequestBody CreateOrderRequest request
    ) throws Exception {
        Map<String, Object> result = paymentService.createOrder(user, request.planId);
        return ResponseEntity.ok(result);
    }

    /**
     * POST /api/payment/verify
     * Verifies the payment signature and adds credits to the user.
     * Body: { "orderId": "...", "paymentId": "...", "signature": "..." }
     */
    @PostMapping("/verify")
    public ResponseEntity<Map<String, Object>> verify(
        @CurrentUser User user,
        @RequestBody VerifyPaymentRequest request
    ) {
        Map<String, Object> result = paymentService.verifyAndCredit(user, request.orderId, request.paymentId, request.signature);
        return ResponseEntity.ok(result);
    }

    // ── Request DTOs ─────────────────────────────────────────────────────────

    public static class CreateOrderRequest {
        public String planId;
    }

    public static class VerifyPaymentRequest {
        public String orderId;
        public String paymentId;
        public String signature;
    }
}
