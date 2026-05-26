package com.resumescorer.service.ai.providers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.resumescorer.service.ai.AiProvider;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * OpenRouter provider — routes to any model via OpenAI-compatible API.
 * Docs: https://openrouter.ai/docs
 *
 * Set OPENROUTER_MODEL to any model slug, e.g.:
 *   anthropic/claude-3.5-sonnet
 *   google/gemini-pro-1.5
 *   meta-llama/llama-3-70b-instruct
 *   mistralai/mixtral-8x7b
 */
@Slf4j
@Service
public class OpenRouterAiProvider implements AiProvider {

    private static final MediaType JSON = MediaType.get("application/json");

    @Value("${app.ai.openrouter.api-key:}")
    private String apiKey;

    @Value("${app.ai.openrouter.model:anthropic/claude-3.5-sonnet}")
    private String model;

    @Value("${app.ai.openrouter.base-url:https://openrouter.ai/api/v1}")
    private String baseUrl;

    private final OkHttpClient http = new OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(120, TimeUnit.SECONDS)
            .build();

    private final ObjectMapper mapper = new ObjectMapper();

    @Override
    public String complete(String systemPrompt, String userPrompt) {
        try {
            Map<String, Object> body = Map.of(
                "model", model,
                "temperature", 0.3,
                "messages", List.of(
                    Map.of("role", "system", "content", systemPrompt),
                    Map.of("role", "user", "content", userPrompt)
                )
            );

            Request request = new Request.Builder()
                    .url(baseUrl + "/chat/completions")
                    .header("Authorization", "Bearer " + apiKey)
                    .header("HTTP-Referer", "https://resumescoreai.com")
                    .header("X-Title", "ResumeScore AI")
                    .header("content-type", "application/json")
                    .post(RequestBody.create(mapper.writeValueAsString(body), JSON))
                    .build();

            try (Response response = http.newCall(request).execute()) {
                String responseBody = response.body() != null ? response.body().string() : "";
                if (!response.isSuccessful()) {
                    log.error("OpenRouter API error {}: {}", response.code(), responseBody);
                    throw new RuntimeException("OpenRouter API returned " + response.code() + ": " + responseBody);
                }
                var root = mapper.readTree(responseBody);
                return root.path("choices").get(0).path("message").path("content").asText();
            }
        } catch (Exception e) {
            log.error("OpenRouter API call failed", e);
            throw new RuntimeException("OpenRouter API call failed: " + e.getMessage(), e);
        }
    }

    @Override
    public String providerName() {
        return "OPENROUTER:" + model;
    }
}
