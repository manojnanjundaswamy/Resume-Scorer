package com.resumescorer.model.dto;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.Data;

/**
 * The full merged result returned to the client after all 3 AI passes complete.
 * Serialised directly to JSON in the API response.
 */
@Data
public class AnalysisResult {
    // Contact (Pass 1)
    private String name;
    private String email;
    private String phone;
    private String location;
    private String experienceLevel;

    // Scoring (Pass 2)
    private int overallScore;
    private String grade;
    private String summary;
    private String targetRole;
    private JsonNode categoryScores;
    private JsonNode categoryDescriptions;
    private JsonNode strengths;
    private JsonNode weaknesses;
    private JsonNode improvements;
    private JsonNode keywords;
    private JsonNode missingKeywords;
    private JsonNode jobRecommendations;

    // Interview questions (Pass 3)
    private JsonNode interviewQuestions;

    // Metadata
    private String aiProvider;
    private String analysisId;
}
