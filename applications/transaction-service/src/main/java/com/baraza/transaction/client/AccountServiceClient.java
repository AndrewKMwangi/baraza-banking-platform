package com.baraza.transaction.client;

import com.baraza.transaction.exception.AccountNotFoundException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

@Component
public class AccountServiceClient {

    private final RestClient restClient;

    public AccountServiceClient(
            RestClient.Builder restClientBuilder,
            @Value("${account.service.url}") String accountServiceUrl) {

        this.restClient = restClientBuilder
                .baseUrl(accountServiceUrl)
                .build();
    }

    public AccountResponse getAccountById(Long accountId) {

        try {
            return restClient.get()
                    .uri("/api/accounts/{id}", accountId)
                    .retrieve()
                    .body(AccountResponse.class);

        } catch (HttpClientErrorException.NotFound exception) {
            throw new AccountNotFoundException(accountId);
        }
    }
}