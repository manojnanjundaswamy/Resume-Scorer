package com.resumescorer.repository;

import com.resumescorer.model.entity.Resume;
import com.resumescorer.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ResumeRepository extends JpaRepository<Resume, UUID> {
    List<Resume> findByUserOrderByUploadedAtDesc(User user);
}
