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
 * Anthropic Claude provider using the Messages API.
 * Docs: https://docs.anthropic.com/en/api/messages
 */
@Slf4j
@Service
public class ClaudeAiProvider implements AiProvider {

    private static final MediaType JSON = MediaType.get("application/json");
    private static final String MESSAGES_URL = "https://api.anthropic.com/v1/messages";
    private static final String API_VERSION = "2023-06-01";

    @Value("${app.ai.claude.api-key:}")
    private String apiKey;

    @Value("${app.ai.claude.model:claude-sonnet-4-6}")
    private String model;

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
                "max_tokens", 4096,
                "temperature", 0.3,
                "system", systemPrompt,
                "messages", List.of(
                    Map.of("role", "user", "content", userPrompt)
                )
            );

            Request request = new Request.Builder()
                    .url(MESSAGES_URL)
                    .header("x-api-key", apiKey)
                    .header("anthropic-version", API_VERSION)
                    .header("content-type", "application/json")
                    .post(RequestBody.create(mapper.writeValueAsString(body), JSON))
                    .build();

            try (Response response = http.newCall(request).execute()) {
                String responseBody = response.body() != null ? response.body().string() : "";
                if (!response.isSuccessful()) {
                    log.error("Claude API error {}: {}", response.code(), responseBody);
                    throw new RuntimeException("Claude API returned " + response.code() + ": " + responseBody);
                }
                // Extract text from response: content[0].text
                var root = mapper.readTree(responseBody);
                return root.path("content").get(0).path("text").asText();
            }
        } catch (Exception e) {
            log.error("Claude API call failed", e);
            throw new RuntimeException("Claude API call failed: " + e.getMessage(), e);
        }
    }

    @Override
    public String providerName() {
        return "CLAUDE:" + model;
    }
}
