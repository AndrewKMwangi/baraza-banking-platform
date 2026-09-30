package com.baraza.transaction.exception;

public class DuplicateTransactionReferenceException extends RuntimeException {

    public DuplicateTransactionReferenceException(String reference) {
        super("Transaction reference already exists: " + reference);
    }
}
