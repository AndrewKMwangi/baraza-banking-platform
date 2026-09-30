package com.baraza.transaction.exception;

public class ConflictingTransactionRequestException extends RuntimeException {

    public ConflictingTransactionRequestException(String reference) {
        super("Transaction reference is already used with different transaction details: " + reference);
    }
}
