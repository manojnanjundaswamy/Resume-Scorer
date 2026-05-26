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
 * Google Gemini provider using the generateContent REST API.
 * Docs: https://ai.google.dev/api/generate-content
 */
@Slf4j
@Service
public class GeminiAiProvider implements AiProvider {

    private static final MediaType JSON = MediaType.get("application/json");

    @Value("${app.ai.gemini.api-key:}")
    private String apiKey;

    @Value("${app.ai.gemini.model:gemini-1.5-pro}")
    private String model;

    private final OkHttpClient http = new OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(120, TimeUnit.SECONDS)
            .build();

    private final ObjectMapper mapper = new ObjectMapper();

    @Override
    public String complete(String systemPrompt, String userPrompt) {
        try {
            String url = "https://generativelanguage.googleapis.com/v1beta/models/"
                    + model + ":generateContent?key=" + apiKey;

            // Gemini combines system + user into a single user turn
            String combinedPrompt = systemPrompt + "\n\n" + userPrompt;

            Map<String, Object> body = Map.of(
                "contents", List.of(
                    Map.of("role", "user", "parts", List.of(
                        Map.of("text", combinedPrompt)
                    ))
                ),
                "generationConfig", Map.of(
                    "temperature", 0.3,
                    "maxOutputTokens", 4096,
                    "responseMimeType", "application/json"
                )
            );

            Request request = new Request.Builder()
                    .url(url)
                    .header("content-type", "application/json")
                    .post(RequestBody.create(mapper.writeValueAsString(body), JSON))
                    .build();

            try (Response response = http.newCall(request).execute()) {
                String responseBody = response.body() != null ? response.body().string() : "";
                if (!response.isSuccessful()) {
                    log.error("Gemini API error {}: {}", response.code(), responseBody);
                    throw new RuntimeException("Gemini API returned " + response.code() + ": " + responseBody);
                }
                var root = mapper.readTree(responseBody);
                return root.path("candidates").get(0)
                           .path("content").path("parts").get(0)
                           .path("text").asText();
            }
        } catch (Exception e) {
            log.error("Gemini API call failed", e);
            throw new RuntimeException("Gemini API call failed: " + e.getMessage(), e);
        }
    }

    @Override
    public String providerName() {
        return "GEMINI:" + model;
    }
}
