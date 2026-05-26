package com.resumescorer.exception;

public class UnauthorizedException extends RuntimeException {
    public UnauthorizedException() {
        super("You are not authorized to access this resource.");
    }
    public UnauthorizedException(String message) {
        super(message);
    }
}
