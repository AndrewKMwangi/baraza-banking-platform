package com.baraza.transaction.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(TransactionNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public Map<String, Object> handleTransactionNotFound(
            TransactionNotFoundException exception) {

        return Map.of(
                "status", 404,
                "error", "TRANSACTION_NOT_FOUND",
                "message", exception.getMessage()
        );
    }

    @ExceptionHandler(DuplicateTransactionReferenceException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public Map<String, Object> handleDuplicateTransactionReference(
            DuplicateTransactionReferenceException exception) {

        return Map.of(
                "status", 409,
                "error", "DUPLICATE_TRANSACTION_REFERENCE",
                "message", exception.getMessage()
        );
    }

    @ExceptionHandler(ConflictingTransactionRequestException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public Map<String, Object> handleConflictingTransactionRequest(
            ConflictingTransactionRequestException exception) {

        return Map.of(
                "status", 409,
                "error", "CONFLICTING_TRANSACTION_REQUEST",
                "message", exception.getMessage()
        );
    }

    @ExceptionHandler(UnsupportedTransactionTypeException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> handleUnsupportedTransactionType(
            UnsupportedTransactionTypeException exception) {

        return Map.of(
                "status", 400,
                "error", "UNSUPPORTED_TRANSACTION_TYPE",
                "message", exception.getMessage()
        );
    }

    @ExceptionHandler(UnsupportedCurrencyException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> handleUnsupportedCurrency(
            UnsupportedCurrencyException exception) {

        return Map.of(
                "status", 400,
                "error", "UNSUPPORTED_CURRENCY",
                "message", exception.getMessage()
        );
    }

    @ExceptionHandler(InvalidTransactionStateTransitionException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public Map<String, Object> handleInvalidTransactionStateTransition(
            InvalidTransactionStateTransitionException exception) {

        return Map.of(
                "status", 409,
                "error", "INVALID_TRANSACTION_STATE_TRANSITION",
                "message", exception.getMessage()
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> handleValidationException(
            MethodArgumentNotValidException exception) {

        Map<String, String> fieldErrors = new LinkedHashMap<>();

        exception.getBindingResult()
                .getFieldErrors()
                .forEach(error ->
                        fieldErrors.put(
                                error.getField(),
                                error.getDefaultMessage()
                        )
                );

        Map<String, Object> response = new LinkedHashMap<>();

        response.put("status", 400);
        response.put("error", "VALIDATION_FAILED");
        response.put("message", "Request validation failed");
        response.put("fieldErrors", fieldErrors);

        return response;
    }

    @ExceptionHandler(AccountNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public Map<String, Object> handleAccountNotFound(
            AccountNotFoundException exception) {

        return Map.of(
                "status", 404,
                "error", "ACCOUNT_NOT_FOUND",
                "message", exception.getMessage()
        );
    }
}