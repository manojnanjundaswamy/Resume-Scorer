package com.resumescorer.service.ai;

/**
 * Core abstraction for all AI providers.
 *
 * To add a new provider (e.g. Mistral, Cohere):
 *  1. Implement this interface
 *  2. Add a @Service annotation
 *  3. Add the provider name to AiProviderType
 *  4. Register it in AiProviderFactory
 *  5. Add its config key to application.properties
 *
 * No other code needs to change.
 */
public interface AiProvider {

    /**
     * Send a prompt to the AI provider and return the raw text response.
     *
     * @param systemPrompt  System-level instructions for the model
     * @param userPrompt    The user-turn content (resume text, JD, etc.)
     * @return              Raw text response from the model (expected to be JSON)
     */
    String complete(String systemPrompt, String userPrompt);

    /**
     * Human-readable name of the provider, used for logging and the
     * "ai_provider" field stored in the analyses table.
     */
    String providerName();
}
