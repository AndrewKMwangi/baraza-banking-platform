package com.baraza.transaction.dto;

import jakarta.validation.constraints.NotBlank;

public class TransactionStatusUpdateRequest {

    @NotBlank
    private String status;

    public TransactionStatusUpdateRequest() {
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}