package com.vitorbertoo.delivery_tracker_backend.dto;

import java.util.List;

public record CreateOrderRequest(
        String clientName,
        String clientPhone,
        String deliveryStreet,
        String deliveryNumber,
        String deliveryComplement,
        String deliveryNeighborhood,
        String deliveryCity,
        String deliveryState,
        String deliveryZip,
        List<OrderItemRequest> items) {}
