package com.baraza.transaction.exception;

public class AccountNotFoundException extends RuntimeException {

    public AccountNotFoundException(Long accountId) {
        super("Account not found: " + accountId);
    }
}
