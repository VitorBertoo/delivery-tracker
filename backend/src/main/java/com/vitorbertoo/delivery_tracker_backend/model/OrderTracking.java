package com.vitorbertoo.delivery_tracker_backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "order_tracking")
public class OrderTracking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", unique = true, nullable = false)
    private Long orderId;

    @Column(name = "origin_lat", nullable = false)
    private Double originLat;

    @Column(name = "origin_lng", nullable = false)
    private Double originLng;

    @Column(name = "dest_lat", nullable = false)
    private Double destLat;

    @Column(name = "dest_lng", nullable = false)
    private Double destLng;

    @Column(name = "route_geometry", columnDefinition = "TEXT")
    private String routeGeometry; // JSON array of [lng, lat] pairs from OSRM

    @Column(name = "total_duration_seconds")
    private Double totalDurationSeconds;

    @Column(name = "total_distance_meters")
    private Double totalDistanceMeters;

    @Column(name = "dispatched_at", nullable = false)
    private LocalDateTime dispatchedAt;

    public OrderTracking() {}

    public OrderTracking(
            Long orderId,
            Double originLat,
            Double originLng,
            Double destLat,
            Double destLng,
            String routeGeometry,
            Double totalDurationSeconds,
            Double totalDistanceMeters) {
        this.orderId = orderId;
        this.originLat = originLat;
        this.originLng = originLng;
        this.destLat = destLat;
        this.destLng = destLng;
        this.routeGeometry = routeGeometry;
        this.totalDurationSeconds = totalDurationSeconds;
        this.totalDistanceMeters = totalDistanceMeters;
        this.dispatchedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Long getOrderId() {
        return orderId;
    }

    public Double getOriginLat() {
        return originLat;
    }

    public Double getOriginLng() {
        return originLng;
    }

    public Double getDestLat() {
        return destLat;
    }

    public Double getDestLng() {
        return destLng;
    }

    public String getRouteGeometry() {
        return routeGeometry;
    }

    public Double getTotalDurationSeconds() {
        return totalDurationSeconds;
    }

    public Double getTotalDistanceMeters() {
        return totalDistanceMeters;
    }

    public LocalDateTime getDispatchedAt() {
        return dispatchedAt;
    }
}
