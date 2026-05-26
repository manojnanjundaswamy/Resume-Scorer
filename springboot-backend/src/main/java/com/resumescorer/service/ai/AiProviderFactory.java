package com.resumescorer.service.ai;

import com.resumescorer.service.ai.providers.ClaudeAiProvider;
import com.resumescorer.service.ai.providers.GeminiAiProvider;
import com.resumescorer.service.ai.providers.MockAiProvider;
import com.resumescorer.service.ai.providers.OpenAiProvider;
import com.resumescorer.service.ai.providers.OpenRouterAiProvider;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Selects and returns the correct AiProvider based on ACTIVE_AI_PROVIDER env var.
 * All callers depend only on the AiProvider interface — never on concrete classes.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AiProviderFactory {

    @Value("${app.ai.active-provider:CLAUDE}")
    private String activeProviderName;

    private final ClaudeAiProvider claudeProvider;
    private final GeminiAiProvider geminiProvider;
    private final OpenAiProvider openAiProvider;
    private final OpenRouterAiProvider openRouterProvider;
    private final MockAiProvider mockProvider;

    private AiProvider activeProvider;

    @PostConstruct
    public void init() {
        AiProviderType type = AiProviderType.valueOf(activeProviderName.toUpperCase());
        activeProvider = switch (type) {
            case CLAUDE      -> claudeProvider;
            case GEMINI      -> geminiProvider;
            case OPENAI      -> openAiProvider;
            case OPENROUTER  -> openRouterProvider;
            case MOCK        -> mockProvider;
        };
        log.info("✅ AI Provider active: {}", activeProvider.providerName());
    }

    /**
     * Returns the configured AiProvider. Inject this factory and call getProvider()
     * rather than injecting a concrete provider directly.
     */
    public AiProvider getProvider() {
        return activeProvider;
    }
}
