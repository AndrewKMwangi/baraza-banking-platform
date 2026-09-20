package com.baraza.account;

import com.baraza.account.dto.AccountUpdateRequest;
import com.baraza.account.entity.Account;
import com.baraza.account.repository.AccountRepository;
import com.baraza.account.service.AccountService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

@Testcontainers
@SpringBootTest
class AccountServiceApplicationTests {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres =
            new PostgreSQLContainer<>("postgres:16");

    @Autowired
    private AccountService accountService;

    @Autowired
    private AccountRepository accountRepository;

    @Test
    void accountUpdateMustNotChangeBalance() {

        Account account = new Account();
        account.setCustomerId(1004L);
        account.setAccountNumber("ACC-1004");
        account.setAccountType("SAVINGS");
        account.setCurrency("KES");
        account.setBalance(new BigDecimal("10000.00"));
        account.setStatus("ACTIVE");

        Account savedAccount = accountRepository.save(account);

        AccountUpdateRequest updateRequest = new AccountUpdateRequest();
        updateRequest.setCustomerId(1004L);
        updateRequest.setAccountNumber("ACC-1004");
        updateRequest.setAccountType("CURRENT");
        updateRequest.setCurrency("KES");
        updateRequest.setStatus("ACTIVE");

        Account updatedAccount =
                accountService.updateAccount(savedAccount.getId(), updateRequest);

        assertEquals("CURRENT", updatedAccount.getAccountType());

        assertEquals(
                new BigDecimal("10000.00"),
                updatedAccount.getBalance()
        );
    }

    @Test
    void contextLoads() {
    }
}
