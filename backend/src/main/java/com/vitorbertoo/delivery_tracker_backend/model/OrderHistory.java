package com.vitorbertoo.delivery_tracker_backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "order_history")
public class OrderHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", insertable = false, updatable = false)
    private Long orderId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status;

    @Column(name = "changed_at")
    private LocalDateTime changedAt;

    @ManyToOne
    @JoinColumn(name = "changed_by")
    private User changedBy;

    public OrderHistory() {}

    public OrderHistory(OrderStatus status, User changedBy) {
        this.status = status;
        this.changedBy = changedBy;
        this.changedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Long getOrderId() {
        return orderId;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public LocalDateTime getChangedAt() {
        return changedAt;
    }

    public User getChangedBy() {
        return changedBy;
    }
}
