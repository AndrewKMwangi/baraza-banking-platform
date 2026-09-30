package com.baraza.transaction;

import com.baraza.transaction.client.AccountServiceClient;
import com.baraza.transaction.dto.TransactionRequest;
import com.baraza.transaction.entity.Transaction;
import com.baraza.transaction.exception.ConflictingTransactionRequestException;
import com.baraza.transaction.exception.InvalidTransactionStateTransitionException;
import com.baraza.transaction.exception.TransactionNotFoundException;
import com.baraza.transaction.exception.UnsupportedCurrencyException;
import com.baraza.transaction.exception.UnsupportedTransactionTypeException;
import com.baraza.transaction.repository.TransactionRepository;
import com.baraza.transaction.service.TransactionService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class TransactionServiceTest {

    @Test
    void shouldReturnTransactionWhenTransactionExists() {

        TransactionRepository transactionRepository =
                mock(TransactionRepository.class);

        AccountServiceClient accountServiceClient =
                mock(AccountServiceClient.class);

        TransactionService transactionService =
                new TransactionService(
                        transactionRepository,
                        accountServiceClient);

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

        AccountServiceClient accountServiceClient =
                mock(AccountServiceClient.class);

        TransactionService transactionService =
                new TransactionService(
                        transactionRepository,
                        accountServiceClient);

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

        AccountServiceClient accountServiceClient =
                mock(AccountServiceClient.class);

        TransactionService transactionService =
                new TransactionService(
                        transactionRepository,
                        accountServiceClient);

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

        verify(accountServiceClient)
                .getAccountById(1001L);

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

    @Test
    void shouldReturnExistingTransactionWhenSameTransactionIsRetried() {

        TransactionRepository transactionRepository =
                mock(TransactionRepository.class);

        AccountServiceClient accountServiceClient =
                mock(AccountServiceClient.class);

        TransactionService transactionService =
                new TransactionService(
                        transactionRepository,
                        accountServiceClient);

        Transaction existingTransaction = new Transaction();
        existingTransaction.setId(1L);
        existingTransaction.setAccountId(1001L);
        existingTransaction.setTransactionType("DEPOSIT");
        existingTransaction.setAmount(new BigDecimal("500.00"));
        existingTransaction.setCurrency("KES");
        existingTransaction.setStatus("PENDING");
        existingTransaction.setReference("TXN-001");
        existingTransaction.setCreatedAt(LocalDateTime.now());

        when(transactionRepository.findByReference("TXN-001"))
                .thenReturn(Optional.of(existingTransaction));

        TransactionRequest request = new TransactionRequest();
        request.setAccountId(1001L);
        request.setTransactionType("DEPOSIT");
        request.setAmount(new BigDecimal("500.00"));
        request.setCurrency("KES");
        request.setReference("TXN-001");

        Transaction result =
                transactionService.createTransaction(request);

        verify(accountServiceClient)
                .getAccountById(1001L);

        assertEquals(existingTransaction, result);

        verify(transactionRepository, never())
                .save(org.mockito.ArgumentMatchers.any(Transaction.class));
    }

    @Test
    void shouldRejectConflictingTransactionRequest() {

        TransactionRepository transactionRepository =
                mock(TransactionRepository.class);

        AccountServiceClient accountServiceClient =
                mock(AccountServiceClient.class);

        TransactionService transactionService =
                new TransactionService(
                        transactionRepository,
                        accountServiceClient);

        Transaction existingTransaction = new Transaction();
        existingTransaction.setId(1L);
        existingTransaction.setAccountId(1001L);
        existingTransaction.setTransactionType("DEPOSIT");
        existingTransaction.setAmount(new BigDecimal("500.00"));
        existingTransaction.setCurrency("KES");
        existingTransaction.setStatus("PENDING");
        existingTransaction.setReference("TXN-001");
        existingTransaction.setCreatedAt(LocalDateTime.now());

        when(transactionRepository.findByReference("TXN-001"))
                .thenReturn(Optional.of(existingTransaction));

        TransactionRequest request = new TransactionRequest();
        request.setAccountId(1001L);
        request.setTransactionType("DEPOSIT");
        request.setAmount(new BigDecimal("750.00"));
        request.setCurrency("KES");
        request.setReference("TXN-001");

        assertThrows(
                ConflictingTransactionRequestException.class,
                () -> transactionService.createTransaction(request)
        );

        verify(accountServiceClient)
                .getAccountById(1001L);

        verify(transactionRepository, never())
                .save(org.mockito.ArgumentMatchers.any(Transaction.class));
    }

    @Test
    void shouldCompletePendingTransaction() {

        TransactionRepository transactionRepository =
                mock(TransactionRepository.class);

        AccountServiceClient accountServiceClient =
                mock(AccountServiceClient.class);

        TransactionService transactionService =
                new TransactionService(
                        transactionRepository,
                        accountServiceClient);

        Transaction transaction = new Transaction();
        transaction.setId(1L);
        transaction.setStatus("PENDING");

        when(transactionRepository.findById(1L))
                .thenReturn(Optional.of(transaction));

        when(transactionRepository.save(transaction))
                .thenReturn(transaction);

        Transaction result =
                transactionService.updateTransactionStatus(
                        1L,
                        "COMPLETED");

        assertEquals("COMPLETED", result.getStatus());
        verify(transactionRepository).save(transaction);
    }

    @Test
    void shouldFailPendingTransaction() {

        TransactionRepository transactionRepository =
                mock(TransactionRepository.class);

        AccountServiceClient accountServiceClient =
                mock(AccountServiceClient.class);

        TransactionService transactionService =
                new TransactionService(
                        transactionRepository,
                        accountServiceClient);

        Transaction transaction = new Transaction();
        transaction.setId(2L);
        transaction.setStatus("PENDING");

        when(transactionRepository.findById(2L))
                .thenReturn(Optional.of(transaction));

        when(transactionRepository.save(transaction))
                .thenReturn(transaction);

        Transaction result =
                transactionService.updateTransactionStatus(
                        2L,
                        "FAILED");

        assertEquals("FAILED", result.getStatus());
        verify(transactionRepository).save(transaction);
    }

    @Test
    void shouldRejectInvalidTransactionStateTransition() {

        TransactionRepository transactionRepository =
                mock(TransactionRepository.class);

        AccountServiceClient accountServiceClient =
                mock(AccountServiceClient.class);

        TransactionService transactionService =
                new TransactionService(
                        transactionRepository,
                        accountServiceClient);

        Transaction transaction = new Transaction();
        transaction.setId(3L);
        transaction.setStatus("COMPLETED");

        when(transactionRepository.findById(3L))
                .thenReturn(Optional.of(transaction));

        assertThrows(
                InvalidTransactionStateTransitionException.class,
                () -> transactionService.updateTransactionStatus(
                        3L,
                        "FAILED")
        );

        verify(transactionRepository, never())
                .save(org.mockito.ArgumentMatchers.any(Transaction.class));
    }

    @Test
    void shouldAllowSupportedTransactionType() {

        TransactionRepository transactionRepository =
                mock(TransactionRepository.class);

        AccountServiceClient accountServiceClient =
                mock(AccountServiceClient.class);

        TransactionService transactionService =
                new TransactionService(
                        transactionRepository,
                        accountServiceClient);

        TransactionRequest request = new TransactionRequest();
        request.setAccountId(1002L);
        request.setTransactionType("WITHDRAWAL");
        request.setAmount(new BigDecimal("200.00"));
        request.setCurrency("KES");
        request.setReference("TXN-003");

        when(transactionRepository.save(
                org.mockito.ArgumentMatchers.any(Transaction.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Transaction result =
                transactionService.createTransaction(request);

        verify(accountServiceClient)
                .getAccountById(1002L);

        assertEquals("WITHDRAWAL", result.getTransactionType());

        verify(transactionRepository)
                .save(org.mockito.ArgumentMatchers.any(Transaction.class));
    }

    @Test
    void shouldRejectUnsupportedTransactionType() {

        TransactionRepository transactionRepository =
                mock(TransactionRepository.class);

        AccountServiceClient accountServiceClient =
                mock(AccountServiceClient.class);

        TransactionService transactionService =
                new TransactionService(
                        transactionRepository,
                        accountServiceClient);

        TransactionRequest request = new TransactionRequest();
        request.setAccountId(1003L);
        request.setTransactionType("PAYMENT");
        request.setAmount(new BigDecimal("300.00"));
        request.setCurrency("KES");
        request.setReference("TXN-004");

        assertThrows(
                UnsupportedTransactionTypeException.class,
                () -> transactionService.createTransaction(request)
        );

        verify(accountServiceClient)
                .getAccountById(1003L);

        verify(transactionRepository, never())
                .save(org.mockito.ArgumentMatchers.any(Transaction.class));
    }

    @Test
    void shouldAllowSupportedCurrency() {

        TransactionRepository transactionRepository =
                mock(TransactionRepository.class);

        AccountServiceClient accountServiceClient =
                mock(AccountServiceClient.class);

        TransactionService transactionService =
                new TransactionService(
                        transactionRepository,
                        accountServiceClient);

        TransactionRequest request = new TransactionRequest();
        request.setAccountId(1004L);
        request.setTransactionType("DEPOSIT");
        request.setAmount(new BigDecimal("1000.00"));
        request.setCurrency("USD");
        request.setReference("TXN-005");

        when(transactionRepository.save(
                org.mockito.ArgumentMatchers.any(Transaction.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Transaction result =
                transactionService.createTransaction(request);

        verify(accountServiceClient)
                .getAccountById(1004L);

        assertEquals("USD", result.getCurrency());

        verify(transactionRepository)
                .save(org.mockito.ArgumentMatchers.any(Transaction.class));
    }

    @Test
    void shouldRejectUnsupportedCurrency() {

        TransactionRepository transactionRepository =
                mock(TransactionRepository.class);

        AccountServiceClient accountServiceClient =
                mock(AccountServiceClient.class);

        TransactionService transactionService =
                new TransactionService(
                        transactionRepository,
                        accountServiceClient);

        TransactionRequest request = new TransactionRequest();
        request.setAccountId(1005L);
        request.setTransactionType("DEPOSIT");
        request.setAmount(new BigDecimal("1000.00"));
        request.setCurrency("XYZ");
        request.setReference("TXN-006");

        assertThrows(
                UnsupportedCurrencyException.class,
                () -> transactionService.createTransaction(request)
        );

        verify(accountServiceClient)
                .getAccountById(1005L);

        verify(transactionRepository, never())
                .save(org.mockito.ArgumentMatchers.any(Transaction.class));
    }
}
