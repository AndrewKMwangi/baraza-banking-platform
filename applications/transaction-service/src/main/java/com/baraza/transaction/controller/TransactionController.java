package com.baraza.transaction.controller;

import com.baraza.transaction.dto.TransactionRequest;
import com.baraza.transaction.entity.Transaction;
import com.baraza.transaction.service.TransactionService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @GetMapping
    public List<Transaction> getAllTransactions() {
        return transactionService.getAllTransactions();
    }

    @GetMapping("/{id}")
    public Transaction getTransactionById(@PathVariable Long id) {
        return transactionService.getTransactionById(id);
    }

    @PostMapping
    public Transaction createTransaction(
            @Valid @RequestBody TransactionRequest request) {
        return transactionService.createTransaction(request);
    }
}
