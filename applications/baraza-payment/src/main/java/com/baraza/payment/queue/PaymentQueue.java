package com.baraza.payment.queue;

import com.baraza.payment.model.Payment;
import org.springframework.stereotype.Component;

import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.ArrayList;
import java.util.List;

@Component
public class PaymentQueue {

    private final BlockingQueue<Payment> queue =
            new LinkedBlockingQueue<>();

    private final BlockingQueue<Payment> deadLetterQueue =
            new LinkedBlockingQueue<>();

    public void publish(Payment payment) {
        queue.add(payment);
    }

    public Payment consume() throws InterruptedException {
        return queue.take();
    }

    public void moveToDeadLetterQueue(Payment payment) {
        deadLetterQueue.add(payment);

        System.out.println(
                "Payment moved to DLQ: "
                        + payment.getTransactionReference()
        );
    }

    public Payment consumeFromDeadLetterQueue()
            throws InterruptedException {

        return deadLetterQueue.take();
    }

    public int getQueueSize() {
        return queue.size();
    }

    public int getDeadLetterQueueSize() {
        return deadLetterQueue.size();
    }
	public List<Payment> getDeadLetterPayments() {
    return new ArrayList<>(deadLetterQueue);
}
public Payment replayFromDeadLetterQueue(String transactionReference) {

    for (Payment payment : deadLetterQueue) {

        if (payment.getTransactionReference()
                .equals(transactionReference)) {

            deadLetterQueue.remove(payment);
            queue.add(payment);

            System.out.println(
                    "Payment replayed from DLQ: "
                            + transactionReference
            );

            return payment;
        }
    }

    return null;
}
}