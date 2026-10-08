package com.baraza.payment.worker;

import com.baraza.payment.model.Payment;
import com.baraza.payment.queue.PaymentQueue;
import com.baraza.payment.service.PaymentService;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

@Component
public class PaymentWorker {

    private final PaymentQueue paymentQueue;
    private final PaymentService paymentService;

    private static final int MAX_RETRIES = 3;

    public PaymentWorker(
            PaymentQueue paymentQueue,
            PaymentService paymentService) {
        this.paymentQueue = paymentQueue;
        this.paymentService = paymentService;
    }

    @PostConstruct
    public void start() {

        Thread workerThread = new Thread(() -> {

            while (true) {

                try {

                    Payment payment = paymentQueue.consume();

                    processWithRetry(payment);

                } catch (InterruptedException e) {

                    Thread.currentThread().interrupt();
                    break;
                }
            }

        });

        workerThread.setName("payment-worker");
        workerThread.start();
    }

    private void processWithRetry(Payment payment) {

        for (int attempt = 1; attempt <= MAX_RETRIES; attempt++) {

            try {

                System.out.println(
                        "Payment Worker attempt "
                                + attempt
                                + ": "
                                + payment.getTransactionReference()
                );

                paymentService.processPayment(payment);

                System.out.println(
                        "Payment processed successfully: "
                                + payment.getTransactionReference()
                );

                return;

            } catch (Exception e) {

                System.out.println(
                        "Payment processing failed. Attempt "
                                + attempt
                                + " of "
                                + MAX_RETRIES
                                + ": "
                                + payment.getTransactionReference()
                );

                if (attempt == MAX_RETRIES) {

                paymentQueue.moveToDeadLetterQueue(payment);

                return;
}

                try {

                    Thread.sleep(5000);

                } catch (InterruptedException interruptedException) {

                    Thread.currentThread().interrupt();
                    return;
                }
            }
        }
    }
}