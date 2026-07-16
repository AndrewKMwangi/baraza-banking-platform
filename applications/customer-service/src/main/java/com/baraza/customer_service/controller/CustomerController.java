package com.baraza.customer_service.controller;
import jakarta.validation.Valid;
import com.baraza.customer_service.entity.Customer;
import com.baraza.customer_service.service.CustomerService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @GetMapping
    public List<Customer> getAllCustomers() {
        return customerService.getAllCustomers();
    }

    @GetMapping("/{id}")
    public Customer getCustomerById(@PathVariable Long id) {
    return customerService.getCustomerById(id);
    }

    @PostMapping
    public Customer createCustomer(@Valid @RequestBody Customer customer) {
    return customerService.saveCustomer(customer);
    }

    @PutMapping("/{id}")
    public Customer updateCustomer(
            @PathVariable Long id,
            @Valid @RequestBody Customer customer) {

        return customerService.updateCustomer(id, customer);
    }

    @DeleteMapping("/{id}")
    public String deleteCustomer(@PathVariable Long id) {

        customerService.deleteCustomer(id);

        return "Customer deleted successfully";
    }
}