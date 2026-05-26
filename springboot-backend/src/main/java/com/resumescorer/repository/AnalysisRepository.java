package com.resumescorer.repository;

import com.resumescorer.model.entity.Analysis;
import com.resumescorer.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface AnalysisRepository extends JpaRepository<Analysis, UUID> {

    /** All analyses for a user, newest first — uses direct user_id FK */
    List<Analysis> findByUserOrderByCreatedAtDesc(User user);
}
