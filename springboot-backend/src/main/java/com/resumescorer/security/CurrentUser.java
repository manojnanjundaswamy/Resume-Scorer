package com.resumescorer.security;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import java.lang.annotation.*;

/**
 * Convenience annotation to inject the authenticated User entity
 * into controller method parameters.
 *
 * Usage: public ResponseEntity<?> myEndpoint(@CurrentUser User user) { ... }
 */
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@AuthenticationPrincipal
public @interface CurrentUser {}
