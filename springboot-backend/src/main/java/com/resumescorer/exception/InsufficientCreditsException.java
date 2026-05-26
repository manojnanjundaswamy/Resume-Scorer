package com.resumescorer.exception;

public class InsufficientCreditsException extends RuntimeException {
    public InsufficientCreditsException() {
        super("You have no credits remaining. Please top up to continue.");
    }
    public InsufficientCreditsException(String message) {
        super(message);
    }
}
