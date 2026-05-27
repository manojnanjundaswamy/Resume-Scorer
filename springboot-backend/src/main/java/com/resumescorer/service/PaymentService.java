package com.resumescorer.service;

import com.resumescorer.exception.ResourceNotFoundException;
import com.resumescorer.model.entity.PaymentOrder;
import com.resumescorer.model.entity.User;
import com.resumescorer.repository.PaymentOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;
import java.util.Base64;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    @Value("${app.payment.razorpay.key-id:}")
    private String razorpayKeyId;

    @Value("${app.payment.razorpay.key-secret:}")
    private String razorpayKeySecret;

    private final PaymentOrderRepository paymentOrderRepository;
    private final CreditService creditService;
    private final OkHttpClient httpClient = new OkHttpClient();

    private String getRazorpayKeyId() {
        String env = System.getenv("RAZORPAY_KEY_ID");
        return env != null ? env : razorpayKeyId;
    }

    private String getRazorpayKeySecret() {
        String env = System.getenv("RAZORPAY_KEY_SECRET");
        return env != null ? env : razorpayKeySecret;
    }

    private void assertRazorpayConfigured() {
        if (getRazorpayKeyId().isBlank() || getRazorpayKeySecret().isBlank()) {
            throw new IllegalStateException("Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
        }
    }

    private static final Map<String, PlanDefinition> PLANS = Map.ofEntries(
        Map.entry("pay_as_you_go", new PlanDefinition("pay_as_you_go", 1, 1000, "Pay as you go", "Rs. 10 per credit")),
        Map.entry("starter_pack", new PlanDefinition("starter_pack", 12, 99 * 100, "Starter Pack", "Rs. 99 for 12 credits")),
        Map.entry("monthly_basic", new PlanDefinition("monthly_basic", 20, 99 * 100, "Monthly Basic", "Rs. 99/month for 20 credits")),
        Map.entry("monthly_pro", new PlanDefinition("monthly_pro", 50, 199 * 100, "Monthly Pro", "Rs. 199/month for 50 credits"))
    );

    public static class PlanDefinition {
        public String planId;
        public int credits;
        public int amountPaise;
        public String name;
        public String description;

        public PlanDefinition(String planId, int credits, int amountPaise, String name, String description) {
            this.planId = planId;
            this.credits = credits;
            this.amountPaise = amountPaise;
            this.name = name;
            this.description = description;
        }
    }

    /**
     * Get all available payment plans.
     */
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getPlans() {
        List<Map<String, Object>> plans = new ArrayList<>();
        for (PlanDefinition p : PLANS.values()) {
            Map<String, Object> m = new HashMap<>();
            m.put("planId", p.planId);
            m.put("credits", p.credits);
            m.put("amountPaise", p.amountPaise);
            m.put("name", p.name);
            m.put("description", p.description);
            plans.add(m);
        }
        return plans;
    }

    /**
     * Create a Razorpay order for the given plan.
     */
    @Transactional
    public Map<String, Object> createOrder(User user, String planId) throws Exception {
        assertRazorpayConfigured();

        if (!PLANS.containsKey(planId)) {
            throw new IllegalArgumentException("Invalid plan: " + planId);
        }

        PlanDefinition plan = PLANS.get(planId);

        JSONObject orderRequest = new JSONObject();
        orderRequest.put("amount", plan.amountPaise);
        orderRequest.put("currency", "INR");
        // Receipt max 40 chars: use hash of userId + timestamp
        String receipt = "ord_" + System.nanoTime() % 1000000000;
        orderRequest.put("receipt", receipt);
        orderRequest.put("notes", new JSONObject()
            .put("userId", user.getId().toString())
            .put("planId", planId)
        );

        String auth = Base64.getEncoder().encodeToString(
            (getRazorpayKeyId() + ":" + getRazorpayKeySecret()).getBytes(StandardCharsets.UTF_8)
        );

        RequestBody body = RequestBody.create(orderRequest.toString(), MediaType.get("application/json"));
        Request request = new Request.Builder()
            .url("https://api.razorpay.com/v1/orders")
            .header("Authorization", "Basic " + auth)
            .post(body)
            .build();

        try (Response response = httpClient.newCall(request).execute()) {
            String responseBody = response.body() != null ? response.body().string() : "";
            if (!response.isSuccessful()) {
                log.error("Razorpay API error {}: {}", response.code(), responseBody);
                throw new RuntimeException("Razorpay API error: " + response.code());
            }
            JSONObject razorpayOrder = new JSONObject(responseBody);
            String razorpayOrderId = razorpayOrder.getString("id");

            PaymentOrder order = PaymentOrder.builder()
                .id(UUID.randomUUID())
                .user(user)
                .razorpayOrderId(razorpayOrderId)
                .amountPaise(plan.amountPaise)
                .credits(plan.credits)
                .planId(planId)
                .status("CREATED")
                .createdAt(Instant.now())
                .build();

            paymentOrderRepository.save(order);
            log.info("Created Razorpay order: orderId={}, user={}, plan={}, amount={}", razorpayOrderId, user.getId(), planId, plan.amountPaise);

            return Map.of(
                "orderId", razorpayOrderId,
                "amount", plan.amountPaise,
                "currency", "INR",
                "key", getRazorpayKeyId()
            );
        }
    }

    /**
     * Verify payment signature and credit the user.
     */
    @Transactional
    public Map<String, Object> verifyAndCredit(User user, String orderId, String paymentId, String signature) {
        assertRazorpayConfigured();

        PaymentOrder order = paymentOrderRepository.findByRazorpayOrderId(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Payment order not found: " + orderId));

        if (!order.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Payment order does not belong to this user");
        }

        // Verify HMAC-SHA256 signature
        String payload = orderId + "|" + paymentId;
        String expectedSignature = generateSignature(payload, getRazorpayKeySecret());

        if (!expectedSignature.equals(signature)) {
            log.error("Invalid payment signature for orderId={}", orderId);
            order.setStatus("FAILED");
            paymentOrderRepository.save(order);
            throw new RuntimeException("Invalid payment signature");
        }

        // Mark as paid and add credits
        order.setRazorpayPaymentId(paymentId);
        order.setStatus("PAID");
        order.setVerifiedAt(Instant.now());
        paymentOrderRepository.save(order);

        creditService.addCredits(user, order.getCredits(), "PAYMENT_" + order.getPlanId(), null);
        log.info("Payment verified and credits added: orderId={}, user={}, credits={}", orderId, user.getId(), order.getCredits());

        return Map.of(
            "success", true,
            "creditsAdded", order.getCredits(),
            "creditsRemaining", user.getCreditsRemaining()
        );
    }

    /**
     * Generate HMAC-SHA256 signature for Razorpay verification.
     */
    private String generateSignature(String payload, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(), "HmacSHA256"));
            byte[] hmac = mac.doFinal(payload.getBytes());
            StringBuilder sb = new StringBuilder();
            for (byte b : hmac) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate signature", e);
        }
    }
}

