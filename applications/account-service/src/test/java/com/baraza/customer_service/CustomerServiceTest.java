package com.baraza.customer_service.service;

import com.baraza.customer_service.entity.Customer;
import com.baraza.customer_service.repository.CustomerRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CustomerServiceTest {

    @Mock
    private CustomerRepository customerRepository;

    @InjectMocks
    private CustomerService customerService;

    @Test
    void shouldReturnAllCustomers() {

        Customer customer = new Customer();
        customer.setId(1L);
        customer.setFirstName("Andrew");
        customer.setLastName("Mwangi");
        customer.setAccountNumber("ACC100001");
        customer.setBalance(50000.0);
        customer.setCurrency("KES");
        customer.setStatus("ACTIVE");

        when(customerRepository.findAll())
                .thenReturn(List.of(customer));

        List<Customer> customers = customerService.getAllCustomers();

        assertEquals(1, customers.size());
        assertEquals("Andrew", customers.get(0).getFirstName());
    }

    @Test
    void shouldReturnCustomerById() {

        Customer customer = new Customer();
        customer.setId(1L);
        customer.setFirstName("Andrew");

        when(customerRepository.findById(1L))
                .thenReturn(Optional.of(customer));

        Customer result = customerService.getCustomerById(1L);

        assertEquals(1L, result.getId());
        assertEquals("Andrew", result.getFirstName());
    }

    @Test
    void shouldSaveCustomer() {

        Customer customer = new Customer();
        customer.setFirstName("Andrew");
        customer.setLastName("Mwangi");
        customer.setAccountNumber("ACC100001");
        customer.setBalance(50000.0);
        customer.setCurrency("KES");
        customer.setStatus("ACTIVE");

        when(customerRepository.save(customer))
                .thenReturn(customer);

        Customer saved = customerService.saveCustomer(customer);

        assertEquals("Andrew", saved.getFirstName());
        verify(customerRepository, times(1)).save(customer);
    }

    @Test
    void shouldUpdateCustomer() {

        Customer existing = new Customer();
        existing.setId(1L);
        existing.setFirstName("Andrew");

        Customer updated = new Customer();
        updated.setFirstName("John");
        updated.setLastName("Mwangi");
        updated.setAccountNumber("ACC100001");
        updated.setBalance(80000.0);
        updated.setCurrency("KES");
        updated.setStatus("ACTIVE");

        when(customerRepository.findById(1L))
                .thenReturn(Optional.of(existing));

        when(customerRepository.save(any(Customer.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Customer result = customerService.updateCustomer(1L, updated);

        assertEquals("John", result.getFirstName());
        assertEquals(80000.0, result.getBalance());
    }

    @Test
    void shouldDeleteCustomer() {

        Customer customer = new Customer();
        customer.setId(1L);

        when(customerRepository.findById(1L))
                .thenReturn(Optional.of(customer));

        customerService.deleteCustomer(1L);

        verify(customerRepository, times(1)).delete(customer);
    }
}