package com.vitorbertoo.delivery_tracker_backend.dto;

import com.vitorbertoo.delivery_tracker_backend.model.OrderStatus;

public record UpdateStatusRequest(OrderStatus status) {}
