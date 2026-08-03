package com.vitorbertoo.delivery_tracker_backend.controller;

import com.vitorbertoo.delivery_tracker_backend.dto.CreateOrderRequest;
import com.vitorbertoo.delivery_tracker_backend.dto.UpdateStatusRequest;
import com.vitorbertoo.delivery_tracker_backend.model.Order;
import com.vitorbertoo.delivery_tracker_backend.model.OrderHistory;
import com.vitorbertoo.delivery_tracker_backend.model.User;
import com.vitorbertoo.delivery_tracker_backend.service.OrderService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/orders")
@SecurityRequirement(name = "bearerAuth")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public ResponseEntity<Order> create(
            @RequestBody CreateOrderRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(orderService.create(request, currentUser));
    }

    @GetMapping
    public ResponseEntity<List<Order>> listAll() {
        return ResponseEntity.ok(orderService.listAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Order> getById(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getById(id));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Order> updateStatus(
            @PathVariable Long id,
            @RequestBody UpdateStatusRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(orderService.updateStatus(id, request, currentUser));
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<OrderHistory>> getHistory(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getHistory(id));
    }
}
