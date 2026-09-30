package com.baraza.transaction.exception;

public class UnsupportedCurrencyException extends RuntimeException {

    public UnsupportedCurrencyException(String currency) {
        super("Unsupported transaction currency: " + currency);
    }
}