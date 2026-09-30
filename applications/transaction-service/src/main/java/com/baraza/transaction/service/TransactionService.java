package com.baraza.transaction.service;

import com.baraza.transaction.client.AccountServiceClient;
import com.baraza.transaction.dto.TransactionRequest;
import com.baraza.transaction.entity.Transaction;
import com.baraza.transaction.exception.ConflictingTransactionRequestException;
import com.baraza.transaction.exception.InvalidTransactionStateTransitionException;
import com.baraza.transaction.exception.TransactionNotFoundException;
import com.baraza.transaction.exception.UnsupportedCurrencyException;
import com.baraza.transaction.exception.UnsupportedTransactionTypeException;
import com.baraza.transaction.repository.TransactionRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final AccountServiceClient accountServiceClient;

    public TransactionService(
            TransactionRepository transactionRepository,
            AccountServiceClient accountServiceClient) {

        this.transactionRepository = transactionRepository;
        this.accountServiceClient = accountServiceClient;
    }

    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAll();
    }

    public Transaction getTransactionById(Long id) {
        return transactionRepository.findById(id)
                .orElseThrow(() ->
                        new TransactionNotFoundException(id));
    }

    public Transaction createTransaction(TransactionRequest request) {

        accountServiceClient.getAccountById(request.getAccountId());

        String transactionType = request.getTransactionType();

        if (!transactionType.equals("DEPOSIT")
                && !transactionType.equals("WITHDRAWAL")
                && !transactionType.equals("TRANSFER")) {

            throw new UnsupportedTransactionTypeException(
                    transactionType);
        }

        String currency = request.getCurrency();

        if (!currency.equals("KES")
                && !currency.equals("USD")
                && !currency.equals("EUR")
                && !currency.equals("GBP")) {

            throw new UnsupportedCurrencyException(
                    currency);
        }

        var existingTransaction =
                transactionRepository.findByReference(request.getReference());

        if (existingTransaction.isPresent()) {

            Transaction existing = existingTransaction.get();

            boolean sameTransaction =
                    existing.getAccountId().equals(request.getAccountId())
                    && existing.getTransactionType().equals(request.getTransactionType())
                    && existing.getAmount().compareTo(request.getAmount()) == 0
                    && existing.getCurrency().equals(request.getCurrency());

            if (sameTransaction) {
                return existing;
            }

            throw new ConflictingTransactionRequestException(
                    request.getReference());
        }

        Transaction transaction = new Transaction();

        transaction.setAccountId(request.getAccountId());
        transaction.setTransactionType(request.getTransactionType());
        transaction.setAmount(request.getAmount());
        transaction.setCurrency(request.getCurrency());
        transaction.setReference(request.getReference());

        transaction.setStatus("PENDING");
        transaction.setCreatedAt(LocalDateTime.now());

        return transactionRepository.save(transaction);
    }

    public Transaction updateTransactionStatus(
            Long id,
            String newStatus) {

        Transaction transaction =
                transactionRepository.findById(id)
                        .orElseThrow(() ->
                                new TransactionNotFoundException(id));

        String currentStatus = transaction.getStatus();

        boolean validTransition =
                currentStatus.equals("PENDING")
                && (newStatus.equals("COMPLETED")
                    || newStatus.equals("FAILED"));

        if (!validTransition) {
            throw new InvalidTransactionStateTransitionException(
                    currentStatus,
                    newStatus);
        }

        transaction.setStatus(newStatus);

        return transactionRepository.save(transaction);
    }
}