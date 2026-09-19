package com.baraza.account.controller;

import com.baraza.account.entity.Account;
import com.baraza.account.service.AccountService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @GetMapping
    public List<Account> getAllAccounts() {
        return accountService.getAllAccounts();
    }

    @GetMapping("/{id}")
    public Account getAccountById(@PathVariable Long id) {
        return accountService.getAccountById(id);
    }

    @PostMapping
    public Account createAccount(@Valid @RequestBody Account account) {
        return accountService.saveAccount(account);
    }

    @PutMapping("/{id}")
    public Account updateAccount(
            @PathVariable Long id,
            @Valid @RequestBody Account account) {

        return accountService.updateAccount(id, account);
    }

    @DeleteMapping("/{id}")
    public String deleteAccount(@PathVariable Long id) {
        accountService.deleteAccount(id);
        return "Account deleted successfully";
    }
}