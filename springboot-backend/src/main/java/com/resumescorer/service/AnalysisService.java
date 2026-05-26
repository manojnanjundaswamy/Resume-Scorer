package com.resumescorer.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.resumescorer.exception.ResourceNotFoundException;
import com.resumescorer.model.dto.AnalysisResult;
import com.resumescorer.model.entity.Analysis;
import com.resumescorer.model.entity.Resume;
import com.resumescorer.model.entity.User;
import com.resumescorer.repository.AnalysisRepository;
import com.resumescorer.repository.ResumeRepository;
import com.resumescorer.service.ai.pipeline.AnalysisPipeline;
import com.resumescorer.service.storage.FileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Orchestrates the full analysis workflow:
 *   1. Validate credits
 *   2. Upload file to S3
 *   3. Extract text via PDFBox / Apache POI
 *   4. Run AI pipeline (3 passes)
 *   5. Persist result to PostgreSQL
 *   6. Deduct credit
 *   7. Return result to controller
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AnalysisService {

    private final ResumeParserService parserService;
    private final AnalysisPipeline pipeline;
    private final FileStorageService storageService;
    private final CreditService creditService;
    private final ResumeRepository resumeRepository;
    private final AnalysisRepository analysisRepository;
    private final ObjectMapper mapper;

    @Transactional
    public AnalysisResult analyze(User user, MultipartFile file, String jobDescription) {
        log.info("Starting analysis for user={} file={}", user.getId(), file.getOriginalFilename());

        // 1. Check credits
        creditService.assertHasCredits(user);

        // 2. Upload file to S3
        String s3Key = storageService.upload(user.getId(), file);

        // 3. Extract text
        String resumeText = parserService.extractText(file);
        log.debug("Extracted {} chars from resume", resumeText.length());

        // 4. Persist resume record
        Resume resume = Resume.builder()
                .id(UUID.randomUUID())
                .user(user)
                .fileName(file.getOriginalFilename())
                .s3Key(s3Key)
                .fileSizeBytes(file.getSize())
                .uploadedAt(Instant.now())
                .build();
        resumeRepository.save(resume);

        // 5. Run AI pipeline
        AnalysisResult result = pipeline.run(resumeText, jobDescription);

        // 6. Persist analysis (includes direct user_id FK for efficient history queries)
        Analysis analysis = Analysis.builder()
                .id(UUID.randomUUID())
                .resume(resume)
                .user(user)
                .overallScore(result.getOverallScore())
                .grade(result.getGrade())
                .resultJson(toJson(result))
                .aiProvider(result.getAiProvider())
                .createdAt(Instant.now())
                .build();
        analysisRepository.save(analysis);

        // 7. Deduct credit
        creditService.deductCredit(user, analysis);

        result.setAnalysisId(analysis.getId().toString());
        log.info("Analysis complete id={} score={}", analysis.getId(), result.getOverallScore());
        return result;
    }

    public AnalysisResult getById(UUID id) {
        Analysis analysis = analysisRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Analysis", id.toString()));
        try {
            AnalysisResult result = mapper.readValue(analysis.getResultJson(), AnalysisResult.class);
            result.setAnalysisId(analysis.getId().toString());
            return result;
        } catch (Exception e) {
            throw new ResourceNotFoundException("Failed to deserialize analysis: " + id);
        }
    }

    public List<Analysis> getHistoryForUser(User user) {
        return analysisRepository.findByUserOrderByCreatedAtDesc(user);
    }

    private String toJson(Object obj) {
        try {
            return mapper.writeValueAsString(obj);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize result", e);
        }
    }
}
