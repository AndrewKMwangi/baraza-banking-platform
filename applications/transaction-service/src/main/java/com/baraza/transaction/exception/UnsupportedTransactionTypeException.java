package com.baraza.transaction.exception;

public class UnsupportedTransactionTypeException extends RuntimeException {

    public UnsupportedTransactionTypeException(String transactionType) {
        super("Unsupported transaction type: " + transactionType);
    }
}