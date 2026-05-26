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
 * OpenAI provider using the Chat Completions API.
 * Docs: https://platform.openai.com/docs/api-reference/chat
 */
@Slf4j
@Service
public class OpenAiProvider implements AiProvider {

    private static final MediaType JSON = MediaType.get("application/json");
    private static final String BASE_URL = "https://api.openai.com/v1/chat/completions";

    @Value("${app.ai.openai.api-key:}")
    private String apiKey;

    @Value("${app.ai.openai.model:gpt-4o}")
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
                "temperature", 0.3,
                "response_format", Map.of("type", "json_object"),
                "messages", List.of(
                    Map.of("role", "system", "content", systemPrompt),
                    Map.of("role", "user", "content", userPrompt)
                )
            );

            Request request = new Request.Builder()
                    .url(BASE_URL)
                    .header("Authorization", "Bearer " + apiKey)
                    .header("content-type", "application/json")
                    .post(RequestBody.create(mapper.writeValueAsString(body), JSON))
                    .build();

            try (Response response = http.newCall(request).execute()) {
                String responseBody = response.body() != null ? response.body().string() : "";
                if (!response.isSuccessful()) {
                    log.error("OpenAI API error {}: {}", response.code(), responseBody);
                    throw new RuntimeException("OpenAI API returned " + response.code() + ": " + responseBody);
                }
                var root = mapper.readTree(responseBody);
                return root.path("choices").get(0).path("message").path("content").asText();
            }
        } catch (Exception e) {
            log.error("OpenAI API call failed", e);
            throw new RuntimeException("OpenAI API call failed: " + e.getMessage(), e);
        }
    }

    @Override
    public String providerName() {
        return "OPENAI:" + model;
    }
}
