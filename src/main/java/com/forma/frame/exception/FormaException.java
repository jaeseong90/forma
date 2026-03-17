package com.forma.frame.exception;

public class FormaException extends RuntimeException {
    public FormaException(String message) {
        super(message);
    }

    public FormaException(String message, Throwable cause) {
        super(message, cause);
    }
}
