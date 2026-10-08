package com.baraza.payment.service;

import com.baraza.payment.model.Customer;
import com.baraza.payment.model.Payment;
import com.baraza.payment.repository.CustomerRepository;
import com.baraza.payment.repository.PaymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final CustomerRepository customerRepository;
    
	@Value("${payment.simulated-db-delay-ms:0}")
    private long simulatedDbDelayMs;
	
    public PaymentService(
            PaymentRepository paymentRepository,
            CustomerRepository customerRepository) {

        this.paymentRepository = paymentRepository;
        this.customerRepository = customerRepository;
    }

	private void simulateDatabaseDelay() {

    if (simulatedDbDelayMs <= 0) {
        return;
    }

    try {

        Thread.sleep(simulatedDbDelayMs);

    } catch (InterruptedException e) {

        Thread.currentThread().interrupt();

        throw new IllegalStateException(
                "Payment processing interrupted",
                e
        );
    }
}

    @Transactional
    public Payment processPayment(Payment payment) {
		long startTime = System.currentTimeMillis();
		simulateDatabaseDelay();

        // Idempotency check
        if (paymentRepository
                .findByTransactionReference(
                        payment.getTransactionReference())
                .isPresent()) {

            return paymentRepository
                    .findByTransactionReference(
                            payment.getTransactionReference())
                    .get();
        }

        // Find customer
        Customer customer =
                customerRepository
                        .findByPhone(payment.getPhone())
                        .orElseThrow(() ->
                                new IllegalStateException(
                                        "Customer not found: "
                                                + payment.getPhone()
                                ));

        // Create payment record
        Payment savedPayment =
                paymentRepository.save(payment);

        // Update customer balance
        customer.setBalance(
                customer.getBalance()
                        .add(payment.getAmount())
        );

        customerRepository.save(customer);
		long processingTime = System.currentTimeMillis() - startTime;

		System.out.println(
        "Payment processing time: "
                + processingTime
                + " ms"
);
        return savedPayment;
    }
}