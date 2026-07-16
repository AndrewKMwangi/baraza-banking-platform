package com.baraza.customer_service.service;

import com.baraza.customer_service.entity.Customer;
import com.baraza.customer_service.exception.CustomerNotFoundException;
import com.baraza.customer_service.repository.CustomerRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CustomerService {

    private static final Logger logger =
            LoggerFactory.getLogger(CustomerService.class);

    private final CustomerRepository customerRepository;

    public CustomerService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    public List<Customer> getAllCustomers() {
        logger.info("Fetching all customers");
        return customerRepository.findAll();
    }

    public Customer getCustomerById(Long id) {

        logger.info("Fetching customer with ID: {}", id);

        return customerRepository.findById(id)
                .orElseThrow(() -> new CustomerNotFoundException(
                        "Customer with ID " + id + " was not found"));
    }

    public Customer saveCustomer(Customer customer) {

        logger.info("Creating customer with account number: {}",
                customer.getAccountNumber());

        return customerRepository.save(customer);
    }

    public Customer updateCustomer(Long id, Customer updatedCustomer) {

        logger.info("Updating customer with ID: {}", id);

        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new CustomerNotFoundException(
                        "Customer with ID " + id + " was not found"));

        customer.setFirstName(updatedCustomer.getFirstName());
        customer.setLastName(updatedCustomer.getLastName());
        customer.setAccountNumber(updatedCustomer.getAccountNumber());
        customer.setBalance(updatedCustomer.getBalance());
        customer.setCurrency(updatedCustomer.getCurrency());
        customer.setStatus(updatedCustomer.getStatus());

        return customerRepository.save(customer);
    }

    public void deleteCustomer(Long id) {

        logger.info("Deleting customer with ID: {}", id);

        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new CustomerNotFoundException(
                        "Customer with ID " + id + " was not found"));

        customerRepository.delete(customer);
    }
}