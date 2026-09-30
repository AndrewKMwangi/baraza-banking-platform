package com.baraza.transaction.exception;

public class InvalidTransactionStateTransitionException extends RuntimeException {

    public InvalidTransactionStateTransitionException(
            String currentStatus,
            String requestedStatus) {

        super("Invalid transaction state transition from "
                + currentStatus + " to " + requestedStatus);
    }
}
