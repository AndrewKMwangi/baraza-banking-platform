package com.baraza.transaction.exception;

public class TransactionNotFoundException extends RuntimeException {

    public TransactionNotFoundException(Long id) {
        super("Transaction not found with ID: " + id);
    }
}
