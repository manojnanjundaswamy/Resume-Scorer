package com.resumescorer.controller;

import com.resumescorer.model.dto.AnalysisResult;
import com.resumescorer.model.entity.User;
import com.resumescorer.security.CurrentUser;
import com.resumescorer.service.AnalysisService;
import com.resumescorer.service.CreditService;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AnalysisController {

    private final AnalysisService analysisService;
    private final CreditService creditService;

    /**
     * POST /api/analyze
     * Upload a resume (PDF/DOCX) + optional job description → runs 3-pass AI analysis.
     * Requires 1 credit per call.
     */
    @PostMapping(value = "/analyze", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AnalysisResult> analyze(
            @CurrentUser User user,
            @RequestPart("resume") @NotNull MultipartFile resume,
            @RequestPart(value = "jobDescription", required = false) String jobDescription
    ) {
        if (resume.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        AnalysisResult result = analysisService.analyze(user, resume, jobDescription);
        return ResponseEntity.ok(result);
    }

    /**
     * GET /api/results/{id}
     * Fetch a previously stored analysis by ID.
     */
    @GetMapping("/results/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AnalysisResult> getResult(
            @CurrentUser User user,
            @PathVariable UUID id
    ) {
        AnalysisResult result = analysisService.getById(id);
        return ResponseEntity.ok(result);
    }

    /**
     * GET /api/history
     * Return summary list of past analyses for the authenticated user.
     */
    @GetMapping("/history")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Map<String, Object>>> getHistory(@CurrentUser User user) {
        List<Map<String, Object>> history = analysisService.getHistoryForUser(user)
                .stream()
                .map(a -> Map.<String, Object>of(
                    "id",         a.getId(),
                    "score",      a.getOverallScore(),
                    "grade",      a.getGrade() != null ? a.getGrade() : "",
                    "aiProvider", a.getAiProvider() != null ? a.getAiProvider() : "",
                    "createdAt",  a.getCreatedAt()
                ))
                .toList();
        return ResponseEntity.ok(history);
    }

    /**
     * GET /api/health
     * Unauthenticated liveness probe.
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "ok"));
    }

    /**
     * POST /api/credits/topup
     * Called after successful in-app purchase to credit the account.
     * Production: verify Apple/Google purchase receipt BEFORE calling addCredits.
     */
    @PostMapping("/credits/topup")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> topUp(
            @CurrentUser User user,
            @RequestBody Map<String, Object> body
    ) {
        int amount = (int) body.getOrDefault("amount", 0);
        String reason = (String) body.getOrDefault("reason", "TOPUP");

        if (amount <= 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "Amount must be greater than 0"));
        }

        // TODO: verify Apple/Google in-app purchase receipt here in production
        creditService.addCredits(user, amount, reason.toUpperCase(), null);

        return ResponseEntity.ok(Map.of(
            "creditsRemaining", user.getCreditsRemaining(),
            "added",            amount,
            "message",          amount + " credit(s) added successfully"
        ));
    }
}
