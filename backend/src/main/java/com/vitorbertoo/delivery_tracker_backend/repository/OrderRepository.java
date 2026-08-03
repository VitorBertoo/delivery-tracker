package com.vitorbertoo.delivery_tracker_backend.repository;

import com.vitorbertoo.delivery_tracker_backend.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<Order, Long> {}
