package com.vitorbertoo.delivery_tracker_backend.service;

import com.vitorbertoo.delivery_tracker_backend.dto.CreateOrderRequest;
import com.vitorbertoo.delivery_tracker_backend.dto.UpdateStatusRequest;
import com.vitorbertoo.delivery_tracker_backend.model.Order;
import com.vitorbertoo.delivery_tracker_backend.model.OrderHistory;
import com.vitorbertoo.delivery_tracker_backend.model.OrderItem;
import com.vitorbertoo.delivery_tracker_backend.model.User;
import com.vitorbertoo.delivery_tracker_backend.repository.OrderRepository;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {

    private final OrderRepository orderRepository;

    public OrderService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    @Transactional
    public Order create(CreateOrderRequest request, User currentUser) {
        Order order = new Order();
        order.setUser(currentUser);
        order.setClientName(request.clientName());
        order.setClientPhone(request.clientPhone());
        order.setDeliveryStreet(request.deliveryStreet());
        order.setDeliveryNumber(request.deliveryNumber());
        order.setDeliveryComplement(request.deliveryComplement());
        order.setDeliveryNeighborhood(request.deliveryNeighborhood());
        order.setDeliveryCity(request.deliveryCity());
        order.setDeliveryState(request.deliveryState());
        order.setDeliveryZip(request.deliveryZip());

        if (request.items() != null) {
            for (var itemRequest : request.items()) {
                OrderItem item =
                        new OrderItem(
                                itemRequest.productName(),
                                itemRequest.unitPrice(),
                                itemRequest.quantity());
                order.getItems().add(item);
            }
        }

        BigDecimal total =
                order.getItems().stream()
                        .map(OrderItem::getSubtotal)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
        order.setTotalAmount(total);

        order.getHistory().add(new OrderHistory(order.getStatus(), currentUser));

        return orderRepository.save(order);
    }

    public List<Order> listAll() {
        return orderRepository.findAll();
    }

    public Order getById(Long id) {
        return orderRepository
                .findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + id));
    }

    @Transactional
    public Order updateStatus(Long id, UpdateStatusRequest request, User currentUser) {
        Order order = getById(id);
        order.setStatus(request.status());
        order.getHistory().add(new OrderHistory(request.status(), currentUser));
        return orderRepository.save(order);
    }

    public List<OrderHistory> getHistory(Long id) {
        return getById(id).getHistory();
    }
}
