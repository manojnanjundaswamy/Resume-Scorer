package com.resumescorer.repository;

import com.resumescorer.model.entity.CreditTransaction;
import com.resumescorer.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface CreditTransactionRepository extends JpaRepository<CreditTransaction, UUID> {
    List<CreditTransaction> findByUserOrderByCreatedAtDesc(User user);
}
