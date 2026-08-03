package com.vitorbertoo.delivery_tracker_backend.repository;

import com.vitorbertoo.delivery_tracker_backend.model.OrderTracking;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderTrackingRepository extends JpaRepository<OrderTracking, Long> {

    Optional<OrderTracking> findByOrderId(Long orderId);

    boolean existsByOrderId(Long orderId);
}
