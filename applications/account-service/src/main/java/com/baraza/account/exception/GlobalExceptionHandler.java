package com.baraza.account.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

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

}
