package com.baraza.transaction.service;

import com.baraza.transaction.exception.TransactionNotFoundException;
import com.baraza.transaction.dto.TransactionRequest;
import com.baraza.transaction.entity.Transaction;
import com.baraza.transaction.repository.TransactionRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;

    public TransactionService(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
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
}
