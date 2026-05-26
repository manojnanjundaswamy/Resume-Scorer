package com.resumescorer.service;

import com.resumescorer.exception.InsufficientCreditsException;
import com.resumescorer.model.entity.Analysis;
import com.resumescorer.model.entity.CreditTransaction;
import com.resumescorer.model.entity.User;
import com.resumescorer.repository.CreditTransactionRepository;
import com.resumescorer.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

/**
 * Manages the credit system:
 *   - New users receive FREE_CREDITS on signup
 *   - Each analysis costs COST_PER_ANALYSIS credits
 *   - Credits can be topped up via in-app purchase (external payment → call addCredits)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CreditService {

    @Value("${app.credits.new-user-free-credits:3}")
    private int newUserFreeCredits;

    @Value("${app.credits.cost-per-analysis:1}")
    private int costPerAnalysis;

    private final UserRepository userRepository;
    private final CreditTransactionRepository txnRepository;

    /** Grant free credits to a brand-new user. */
    @Transactional
    public void grantWelcomeCredits(User user) {
        addCredits(user, newUserFreeCredits, "WELCOME_BONUS", null);
        log.info("Granted {} welcome credits to user={}", newUserFreeCredits, user.getId());
    }

    /** Throws if the user doesn't have enough credits. */
    public void assertHasCredits(User user) {
        if (user.getCreditsRemaining() < costPerAnalysis) {
            throw new InsufficientCreditsException(
                "You need " + costPerAnalysis + " credit(s) to run an analysis. " +
                "You have " + user.getCreditsRemaining() + ". Please top up."
            );
        }
    }

    /** Deduct one analysis credit and record the transaction. */
    @Transactional
    public void deductCredit(User user, Analysis analysis) {
        user.setCreditsRemaining(user.getCreditsRemaining() - costPerAnalysis);
        userRepository.save(user);

        CreditTransaction txn = CreditTransaction.builder()
                .id(UUID.randomUUID())
                .user(user)
                .delta(-costPerAnalysis)
                .reason("ANALYSIS")
                .analysis(analysis)
                .createdAt(Instant.now())
                .build();
        txnRepository.save(txn);

        log.info("Deducted {} credit(s) from user={} remaining={}", costPerAnalysis, user.getId(), user.getCreditsRemaining());
    }

    /** Add credits to a user (called after in-app purchase confirmation). */
    @Transactional
    public void addCredits(User user, int amount, String reason, Analysis analysis) {
        user.setCreditsRemaining(user.getCreditsRemaining() + amount);
        userRepository.save(user);

        CreditTransaction txn = CreditTransaction.builder()
                .id(UUID.randomUUID())
                .user(user)
                .delta(amount)
                .reason(reason)
                .analysis(analysis)
                .createdAt(Instant.now())
                .build();
        txnRepository.save(txn);
    }

}
