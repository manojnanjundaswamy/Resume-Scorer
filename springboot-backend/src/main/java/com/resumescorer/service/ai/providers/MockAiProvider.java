package com.resumescorer.service.ai.providers;

import com.resumescorer.service.ai.AiProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Mock AI provider for local testing when no real API key is available.
 * Returns realistic but static JSON responses for all 3 pipeline passes.
 * Enable with: ACTIVE_AI_PROVIDER=MOCK in .env
 */
@Slf4j
@Service
public class MockAiProvider implements AiProvider {

    @Override
    public String complete(String systemPrompt, String userPrompt) {
        log.info("[MOCK] AI call intercepted — returning mock response");

        if (systemPrompt.contains("resume parser")) {
            return PASS1_RESPONSE;
        } else if (systemPrompt.contains("recruiter") || systemPrompt.contains("ATS")) {
            return PASS2_RESPONSE;
        } else if (systemPrompt.contains("interviewer")) {
            return PASS3_RESPONSE;
        }
        return "{}";
    }

    @Override
    public String providerName() {
        return "MOCK";
    }

    // ── Static mock responses ─────────────────────────────────────────────────

    private static final String PASS1_RESPONSE = """
        {
          "contact": {
            "name": "John Smith",
            "email": "john.smith@email.com",
            "phone": "+1 (555) 123-4567",
            "location": "San Francisco, CA"
          },
          "summary": "Experienced Software Engineer with 6+ years of expertise in building scalable backend systems.",
          "experience": [
            {
              "title": "Senior Software Engineer",
              "company": "TechCorp Inc.",
              "duration": "Jan 2022 – Present",
              "bullets": [
                "Architected microservices platform handling 50M+ API requests per day",
                "Reduced system latency by 40% via Redis caching",
                "Led migration from monolith to microservices"
              ]
            },
            {
              "title": "Software Engineer",
              "company": "StartupABC",
              "duration": "Jun 2019 – Dec 2021",
              "bullets": [
                "Built real-time data pipeline using Kafka",
                "Developed recommendation engine using Python/scikit-learn"
              ]
            }
          ],
          "education": [
            {
              "degree": "Bachelor of Science in Computer Science",
              "school": "Stanford University",
              "year": "2017"
            }
          ],
          "skills": ["Java", "Spring Boot", "Python", "PostgreSQL", "AWS", "Kubernetes", "Redis", "Kafka"],
          "certifications": [
            "AWS Certified Solutions Architect – Associate",
            "Google Cloud Professional Data Engineer"
          ],
          "experienceLevel": "Senior Level"
        }
        """;

    private static final String PASS2_RESPONSE = """
        {
          "overallScore": 87,
          "grade": "B+",
          "summary": "Strong senior engineer profile with excellent Java/Spring Boot experience and cloud expertise. Well-suited for the Senior Backend Engineer role.",
          "targetRole": "Senior Backend Engineer",
          "categoryScores": {
            "format": 85,
            "content": 90,
            "atsOptimization": 82,
            "skills": 92,
            "experience": 88,
            "education": 80
          },
          "categoryDescriptions": {
            "format": "Clean, well-structured resume with consistent formatting",
            "content": "Rich content with quantified achievements and technical depth",
            "atsOptimization": "Good keyword coverage, minor gaps in fintech-specific terms",
            "skills": "Excellent match with Java, Spring Boot, PostgreSQL, AWS requirements",
            "experience": "6+ years meets the requirement, strong progression visible",
            "education": "Stanford CS degree is highly relevant"
          },
          "strengths": [
            "Strong Java and Spring Boot expertise matching all core requirements",
            "Proven experience with PostgreSQL and AWS at scale",
            "Kubernetes experience is a differentiator",
            "Quantified achievements demonstrate real impact"
          ],
          "weaknesses": [
            "No fintech-specific experience mentioned",
            "Could highlight security/compliance work more explicitly"
          ],
          "improvements": [
            {
              "category": "ATS Optimization",
              "suggestion": "Add fintech keywords: PCI-DSS, SOC2, regulatory compliance",
              "priority": "High",
              "impact": "Improves ATS matching for fintech-specific job postings"
            },
            {
              "category": "Content",
              "suggestion": "Quantify the Kafka pipeline throughput and latency numbers",
              "priority": "Medium",
              "impact": "Stronger evidence of distributed systems expertise"
            }
          ],
          "keywords": ["Java", "Spring Boot", "PostgreSQL", "AWS", "Kubernetes", "Microservices", "REST API", "CI/CD"],
          "missingKeywords": ["Fintech", "Payment Processing", "PCI-DSS", "Financial Data"],
          "jobRecommendations": [
            {
              "title": "Senior Backend Engineer",
              "matchScore": 87,
              "description": "Excellent match for this role given Java/Spring Boot/AWS skills",
              "skills": ["Java", "Spring Boot", "PostgreSQL", "AWS", "Kubernetes"],
              "linkedinUrl": "https://linkedin.com/jobs/search/?keywords=Senior+Backend+Engineer+Java",
              "indeedUrl": "https://indeed.com/jobs?q=Senior+Backend+Engineer+Java",
              "glassdoorUrl": "https://glassdoor.com/Job/senior-backend-engineer-java-jobs-SRCH_KO0,28.htm"
            }
          ]
        }
        """;

    private static final String PASS3_RESPONSE = """
        {
          "interviewQuestions": {
            "technical": [
              "Walk me through your microservices architecture at TechCorp — how did you handle service discovery and inter-service communication?",
              "How did you achieve the 40% latency reduction with Redis? What caching strategies did you apply and what were the tradeoffs?",
              "Explain how you designed the Kafka-based pipeline to handle 1M events per hour. How did you ensure exactly-once delivery?",
              "In your Kubernetes deployments, how did you handle rolling updates with zero downtime for stateful services?",
              "Describe a complex PostgreSQL query optimization you performed. What tools and techniques did you use?"
            ],
            "behavioral": [
              "Tell me about leading the monolith-to-microservices migration. How did you manage the team and ensure zero production incidents?",
              "Describe a time you had to push back on a product requirement for technical reasons. How did you handle it?",
              "You mention mentoring 3 junior engineers. What is your approach to code reviews and growing junior talent?",
              "Tell me about a production incident you handled. What was your role and what did you learn?",
              "How do you balance delivering features quickly versus maintaining code quality and test coverage?"
            ],
            "hr": [
              "Why are you interested in transitioning to fintech? What draws you to this industry?",
              "Your resume shows strong individual contributor and some tech lead experience. How do you see your career progressing?",
              "You have worked at both a startup and a larger company. Which environment do you prefer and why?",
              "What does your ideal engineering culture look like?",
              "Where do you see yourself in 3–5 years, and how does this Senior Backend Engineer role fit that trajectory?"
            ]
          }
        }
        """;
}
