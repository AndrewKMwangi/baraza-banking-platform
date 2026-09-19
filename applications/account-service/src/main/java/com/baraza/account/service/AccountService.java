package com.baraza.account.service;

import com.baraza.account.dto.AccountUpdateRequest;
import com.baraza.account.entity.Account;
import com.baraza.account.exception.AccountNotFoundException;
import com.baraza.account.repository.AccountRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AccountService {

    private final AccountRepository accountRepository;

    public AccountService(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    public List<Account> getAllAccounts() {
        return accountRepository.findAll();
    }

    public Account getAccountById(Long id) {
        return accountRepository.findById(id)
                .orElseThrow(() ->
                        new AccountNotFoundException(id));
    }

    public Account saveAccount(Account account) {
        return accountRepository.save(account);
    }

    public Account updateAccount(Long id, AccountUpdateRequest updatedAccount) {

        Account account = accountRepository.findById(id)
                .orElseThrow(() ->
                        new AccountNotFoundException(id));

        account.setCustomerId(updatedAccount.getCustomerId());
        account.setAccountNumber(updatedAccount.getAccountNumber());
        account.setAccountType(updatedAccount.getAccountType());
        account.setCurrency(updatedAccount.getCurrency());
        account.setStatus(updatedAccount.getStatus());

        return accountRepository.save(account);
    }

    public void deleteAccount(Long id) {

        Account account = accountRepository.findById(id)
                .orElseThrow(() ->
                        new AccountNotFoundException(id));

        accountRepository.delete(account);
    }
}