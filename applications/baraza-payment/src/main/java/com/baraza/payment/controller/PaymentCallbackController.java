package com.baraza.payment.controller;

import com.baraza.payment.model.Payment;
import com.baraza.payment.queue.PaymentQueue;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class PaymentCallbackController {

    private final PaymentQueue paymentQueue;

    public PaymentCallbackController(PaymentQueue paymentQueue) {
        this.paymentQueue = paymentQueue;
    }

    @PostMapping("/callback")
    public ResponseEntity<String> receiveCallback(
            @RequestBody Map<String, Object> callback) {

        Payment payment = new Payment();

        payment.setTransactionReference(
                (String) callback.get("transactionReference")
        );

        payment.setAmount(
                new BigDecimal(callback.get("amount").toString())
        );

        payment.setPhone(
                (String) callback.get("phone")
        );

        payment.setStatus(
                (String) callback.get("status")
        );

        paymentQueue.publish(payment);

        return ResponseEntity.ok("Payment accepted");
    }
	@GetMapping("/queue-size")
public ResponseEntity<String> getQueueSize() {

    return ResponseEntity.ok(
            "Queue size: " + paymentQueue.getQueueSize()
    );
}
}