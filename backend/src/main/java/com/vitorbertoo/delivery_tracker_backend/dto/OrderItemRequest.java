package com.vitorbertoo.delivery_tracker_backend.dto;

import java.math.BigDecimal;

public record OrderItemRequest(String productName, BigDecimal unitPrice, int quantity) {}
