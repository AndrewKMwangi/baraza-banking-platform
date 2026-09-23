package com.baraza.transaction;

import com.baraza.transaction.dto.TransactionRequest;
import com.baraza.transaction.entity.Transaction;
import com.baraza.transaction.controller.TransactionController;
import com.baraza.transaction.exception.GlobalExceptionHandler;
import com.baraza.transaction.exception.TransactionNotFoundException;
import com.baraza.transaction.service.TransactionService;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

@WebMvcTest(TransactionController.class)
@Import(GlobalExceptionHandler.class)
class TransactionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TransactionService transactionService;

    @Test
    void shouldReturn404WhenTransactionDoesNotExist() throws Exception {

        when(transactionService.getTransactionById(999L))
                .thenThrow(new TransactionNotFoundException(999L));

        mockMvc.perform(
                get("/api/transactions/999")
                        .contentType(MediaType.APPLICATION_JSON)
        )
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.status").value(404))
        .andExpect(jsonPath("$.error")
                .value("TRANSACTION_NOT_FOUND"));
    }
@Test
void shouldCreateTransaction() throws Exception {

    Transaction transaction = new Transaction();
    transaction.setId(1L);
    transaction.setAccountId(1001L);
    transaction.setTransactionType("DEPOSIT");
    transaction.setAmount(new BigDecimal("500.00"));
    transaction.setCurrency("KES");
    transaction.setStatus("PENDING");
    transaction.setReference("TXN-003");

    when(transactionService.createTransaction(
            org.mockito.ArgumentMatchers.any(TransactionRequest.class)))
            .thenReturn(transaction);

    String requestJson = """
            {
                "accountId": 1001,
                "transactionType": "DEPOSIT",
                "amount": 500.00,
                "currency": "KES",
                "reference": "TXN-003"
            }
            """;

    mockMvc.perform(
            post("/api/transactions")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(requestJson)
    )
    .andExpect(status().isOk())
    .andExpect(jsonPath("$.id").value(1))
    .andExpect(jsonPath("$.accountId").value(1001))
    .andExpect(jsonPath("$.transactionType").value("DEPOSIT"))
    .andExpect(jsonPath("$.amount").value(500.00))
    .andExpect(jsonPath("$.currency").value("KES"))
    .andExpect(jsonPath("$.status").value("PENDING"))
    .andExpect(jsonPath("$.reference").value("TXN-003"));
}
@Test
void shouldRejectInvalidTransactionAmount() throws Exception {

    String requestJson = """
            {
                "accountId": 1001,
                "transactionType": "DEPOSIT",
                "amount": -500.00,
                "currency": "KES",
                "reference": "TXN-004"
            }
            """;

    mockMvc.perform(
            post("/api/transactions")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(requestJson)
    )
    .andExpect(status().isBadRequest())
    .andExpect(jsonPath("$.status").value(400))
    .andExpect(jsonPath("$.error")
            .value("VALIDATION_FAILED"))
    .andExpect(jsonPath("$.fieldErrors.amount")
            .value("must be greater than 0"));
}
}