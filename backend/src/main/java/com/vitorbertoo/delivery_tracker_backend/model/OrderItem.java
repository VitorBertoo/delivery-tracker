package com.vitorbertoo.delivery_tracker_backend.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "order_items")
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", insertable = false, updatable = false)
    private Long orderId;

    @Column(name = "product_name")
    private String productName;

    @Column(name = "unit_price")
    private BigDecimal unitPrice;

    @Column
    private Integer quantity;

    @Column
    private BigDecimal subtotal;

    public OrderItem() {}

    public OrderItem(String productName, BigDecimal unitPrice, int quantity) {
        this.productName = productName;
        this.unitPrice = unitPrice;
        this.quantity = quantity;
        this.subtotal = unitPrice.multiply(BigDecimal.valueOf(quantity));
    }

    public Long getId() {
        return id;
    }

    public Long getOrderId() {
        return orderId;
    }

    public String getProductName() {
        return productName;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }
}
