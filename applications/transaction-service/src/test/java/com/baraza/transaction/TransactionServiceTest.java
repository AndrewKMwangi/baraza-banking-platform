package com.baraza.transaction;

import org.mockito.ArgumentCaptor;
import static org.mockito.Mockito.verify;
import com.baraza.transaction.dto.TransactionRequest;
import com.baraza.transaction.entity.Transaction;
import com.baraza.transaction.exception.TransactionNotFoundException;
import com.baraza.transaction.repository.TransactionRepository;
import com.baraza.transaction.service.TransactionService;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class TransactionServiceTest {

    @Test
    void shouldReturnTransactionWhenTransactionExists() {

        TransactionRepository transactionRepository =
                mock(TransactionRepository.class);

        TransactionService transactionService =
                new TransactionService(transactionRepository);

        Transaction transaction = new Transaction();
        transaction.setId(1L);
        transaction.setAccountId(1001L);
        transaction.setTransactionType("DEPOSIT");
        transaction.setAmount(new BigDecimal("500.00"));
        transaction.setCurrency("KES");
        transaction.setStatus("COMPLETED");
        transaction.setReference("TXN-001");
        transaction.setCreatedAt(LocalDateTime.now());

        when(transactionRepository.findById(1L))
                .thenReturn(Optional.of(transaction));

        Transaction result =
                transactionService.getTransactionById(1L);

        assertEquals(1L, result.getId());
        assertEquals("TXN-001", result.getReference());
        assertEquals(new BigDecimal("500.00"), result.getAmount());
    }

    @Test
    void shouldThrowTransactionNotFoundExceptionWhenTransactionDoesNotExist() {

        TransactionRepository transactionRepository =
                mock(TransactionRepository.class);

        TransactionService transactionService =
                new TransactionService(transactionRepository);

        when(transactionRepository.findById(999L))
                .thenReturn(Optional.empty());

        assertThrows(
                TransactionNotFoundException.class,
                () -> transactionService.getTransactionById(999L)
        );
    }

    @Test
    void shouldCreateTransactionWithPendingStatus() {

        TransactionRepository transactionRepository =
                mock(TransactionRepository.class);

        TransactionService transactionService =
                new TransactionService(transactionRepository);

        TransactionRequest request = new TransactionRequest();
        request.setAccountId(1001L);
        request.setTransactionType("DEPOSIT");
        request.setAmount(new BigDecimal("500.00"));
        request.setCurrency("KES");
        request.setReference("TXN-002");

        when(transactionRepository.save(
                org.mockito.ArgumentMatchers.any(Transaction.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Transaction result =
                transactionService.createTransaction(request);

        ArgumentCaptor<Transaction> transactionCaptor =
                ArgumentCaptor.forClass(Transaction.class);

        verify(transactionRepository)
                .save(transactionCaptor.capture());

        Transaction savedTransaction =
                transactionCaptor.getValue();

        assertEquals(1001L, savedTransaction.getAccountId());
        assertEquals("DEPOSIT", savedTransaction.getTransactionType());
        assertEquals(new BigDecimal("500.00"), savedTransaction.getAmount());
        assertEquals("KES", savedTransaction.getCurrency());
        assertEquals("TXN-002", savedTransaction.getReference());
        assertEquals("PENDING", savedTransaction.getStatus());
        assertEquals(savedTransaction, result);
    }
}