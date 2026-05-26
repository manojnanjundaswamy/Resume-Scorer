package com.resumescorer.service.ai.pipeline;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.resumescorer.service.ai.AiProvider;
import com.resumescorer.service.ai.AiProviderFactory;
import com.resumescorer.model.dto.AnalysisResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Orchestrates the 3-pass AI pipeline:
 *   Pass 1 — Structure  : extract structured sections from raw resume text
 *   Pass 2 — Score      : score the structured resume against the job description
 *   Pass 3 — Questions  : generate tailored interview questions
 *
 * All passes use the same AiProvider, selected by AiProviderFactory.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AnalysisPipeline {

    private final AiProviderFactory providerFactory;
    private final ObjectMapper mapper = new ObjectMapper();

    private static final String PASS1_SYSTEM = """
        You are an expert resume parser. Extract structured data from the resume text provided.
        Return ONLY valid JSON — no markdown, no explanation.
        Output this exact schema:
        {
          "contact": { "name": "", "email": "", "phone": "", "location": "" },
          "summary": "",
          "experience": [{ "title": "", "company": "", "duration": "", "bullets": [] }],
          "education": [{ "degree": "", "school": "", "year": "" }],
          "skills": [],
          "certifications": [],
          "experienceLevel": "Entry Level | Mid Level | Senior Level | Executive"
        }
        """;

    private static final String PASS2_SYSTEM = """
        You are an expert recruiter and ATS specialist. Score the structured resume against the job description.
        Scoring weights: Content Quality 25%, Experience Relevance 25%, ATS Optimization 20%,
        Skills Match 20%, Format & Presentation 15%, Education Match 15%.
        Return ONLY valid JSON — no markdown, no explanation.
        Grade thresholds: A+(93-100) A(90-92) A-(87-89) B+(83-86) B(80-82) B-(77-79)
                          C+(73-76) C(70-72) C-(67-69) D(60-66) F(<60)
        Output this exact schema:
        {
          "overallScore": 0,
          "grade": "",
          "summary": "",
          "targetRole": "",
          "categoryScores": { "format": 0, "content": 0, "atsOptimization": 0, "skills": 0, "experience": 0, "education": 0 },
          "categoryDescriptions": { "format": "", "content": "", "atsOptimization": "", "skills": "", "experience": "", "education": "" },
          "strengths": [],
          "weaknesses": [],
          "improvements": [{ "title": "", "description": "", "priority": "High|Medium|Low", "example": "" }],
          "keywords": [],
          "missingKeywords": [],
          "jobRecommendations": [{
            "title": "", "matchScore": 0, "description": "", "skills": [],
            "linkedinUrl": "", "indeedUrl": "", "glassdoorUrl": ""
          }]
        }
        """;

    private static final String PASS3_SYSTEM = """
        You are a senior interviewer. Generate highly specific, tailored interview questions
        based on this candidate's actual background and the job description.
        Do NOT use generic questions. Reference their real experience, projects, and skills.
        Return ONLY valid JSON — no markdown, no explanation.
        Output this exact schema:
        {
          "interviewQuestions": [
            { "category": "Technical", "question": "", "tip": "" },
            { "category": "Technical", "question": "", "tip": "" },
            { "category": "Behavioral", "question": "", "tip": "" },
            { "category": "Behavioral", "question": "", "tip": "" },
            { "category": "HR", "question": "", "tip": "" }
          ]
        }
        """;

    /**
     * Run the full 3-pass pipeline.
     *
     * @param resumeText  Plain text extracted from the uploaded resume file
     * @param jobDesc     Optional job description text (empty string if not provided)
     * @return            Merged AnalysisResult combining all 3 passes
     */
    public AnalysisResult run(String resumeText, String jobDesc) {
        AiProvider provider = providerFactory.getProvider();
        log.info("Starting analysis pipeline with provider: {}", provider.providerName());

        String effectiveJd = (jobDesc == null || jobDesc.isBlank())
                ? "No specific job description provided. Evaluate the resume generally."
                : jobDesc;

        // ── Pass 1: Structure ─────────────────────────────
        log.debug("Pass 1: Extracting structure...");
        String pass1User = "Resume text:\n" + truncate(resumeText, 8000);
        String structuredJson = callWithRetry(provider, PASS1_SYSTEM, pass1User, 3);

        // ── Pass 2: Score ─────────────────────────────────
        log.debug("Pass 2: Scoring...");
        String pass2User = "Structured resume:\n" + structuredJson
                + "\n\nJob Description:\n" + effectiveJd;
        String scoreJson = callWithRetry(provider, PASS2_SYSTEM, pass2User, 3);

        // ── Pass 3: Interview Questions ───────────────────
        log.debug("Pass 3: Generating interview questions...");
        String pass3User = "Structured resume:\n" + structuredJson
                + "\n\nJob Description:\n" + effectiveJd
                + "\n\nScoring context:\n" + scoreJson;
        String questionsJson = callWithRetry(provider, PASS3_SYSTEM, pass3User, 3);

        log.info("Pipeline complete. Provider: {}", provider.providerName());

        return merge(structuredJson, scoreJson, questionsJson, provider.providerName());
    }

    // ── Private helpers ───────────────────────────────────

    private String callWithRetry(AiProvider provider, String system, String user, int maxRetries) {
        int attempt = 0;
        long backoffMs = 1000;
        while (true) {
            try {
                return provider.complete(system, user);
            } catch (Exception e) {
                attempt++;
                if (attempt >= maxRetries) {
                    log.error("AI call failed after {} attempts", maxRetries, e);
                    throw e;
                }
                log.warn("AI call failed (attempt {}), retrying in {}ms...", attempt, backoffMs);
                try { Thread.sleep(backoffMs); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); }
                backoffMs *= 2; // exponential backoff
            }
        }
    }

    private AnalysisResult merge(String structuredJson, String scoreJson, String questionsJson, String providerName) {
        try {
            JsonNode structured = parseJson(structuredJson);
            JsonNode score = parseJson(scoreJson);
            JsonNode questions = parseJson(questionsJson);

            AnalysisResult result = new AnalysisResult();

            // From Pass 1 (structured)
            JsonNode contact = structured.path("contact");
            result.setName(contact.path("name").asText("Unknown"));
            result.setEmail(contact.path("email").asText(null));
            result.setPhone(contact.path("phone").asText(null));
            result.setLocation(contact.path("location").asText(null));
            result.setExperienceLevel(structured.path("experienceLevel").asText("Mid Level"));

            // From Pass 2 (score)
            result.setOverallScore(score.path("overallScore").asInt(0));
            result.setGrade(score.path("grade").asText("C"));
            result.setSummary(score.path("summary").asText(""));
            result.setTargetRole(score.path("targetRole").asText(""));
            result.setCategoryScores(score.path("categoryScores"));
            result.setCategoryDescriptions(score.path("categoryDescriptions"));
            result.setStrengths(score.path("strengths"));
            result.setWeaknesses(score.path("weaknesses"));
            result.setImprovements(score.path("improvements"));
            result.setKeywords(score.path("keywords"));
            result.setMissingKeywords(score.path("missingKeywords"));
            result.setJobRecommendations(score.path("jobRecommendations"));

            // From Pass 3 (questions)
            result.setInterviewQuestions(questions.path("interviewQuestions"));

            result.setAiProvider(providerName);

            return result;
        } catch (Exception e) {
            log.error("Failed to merge pipeline results", e);
            throw new RuntimeException("Failed to parse AI response: " + e.getMessage(), e);
        }
    }

    /** Parse JSON, stripping markdown code fences if the model added them. */
    private JsonNode parseJson(String raw) {
        try {
            String cleaned = raw.trim();
            if (cleaned.startsWith("```")) {
                cleaned = cleaned.replaceFirst("```json\\s*", "").replaceFirst("```\\s*$", "").trim();
            }
            return mapper.readTree(cleaned);
        } catch (Exception e) {
            log.error("Failed to parse JSON response: {}", raw, e);
            throw new RuntimeException("AI returned invalid JSON", e);
        }
    }

    private String truncate(String text, int maxChars) {
        return text.length() > maxChars ? text.substring(0, maxChars) + "..." : text;
    }
}
