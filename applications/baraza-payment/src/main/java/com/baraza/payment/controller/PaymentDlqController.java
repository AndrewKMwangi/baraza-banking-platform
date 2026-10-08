package com.baraza.payment.controller;

import com.baraza.payment.model.Payment;
import com.baraza.payment.queue.PaymentQueue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;

import java.util.List;

@RestController
@RequestMapping("/api/payments/dlq")
public class PaymentDlqController {

    private final PaymentQueue paymentQueue;

    public PaymentDlqController(PaymentQueue paymentQueue) {
        this.paymentQueue = paymentQueue;
    }

    @GetMapping
    public List<Payment> getDeadLetterPayments() {
        return paymentQueue.getDeadLetterPayments();
    }
	@PostMapping("/replay/{transactionReference}")
public ResponseEntity<String> replayPayment(
        @PathVariable String transactionReference) {

    Payment payment =
            paymentQueue.replayFromDeadLetterQueue(transactionReference);

    if (payment == null) {
        return ResponseEntity.notFound().build();
    }

    return ResponseEntity.ok(
            "Payment replayed: " + transactionReference
    );
}
}