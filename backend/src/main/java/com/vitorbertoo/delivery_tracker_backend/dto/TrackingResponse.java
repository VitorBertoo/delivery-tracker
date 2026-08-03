package com.vitorbertoo.delivery_tracker_backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public record TrackingResponse(
        Long orderId,
        Double currentLat,
        Double currentLng,
        Double originLat,
        Double originLng,
        Double destLat,
        Double destLng,
        Double progress,
        Double totalDistanceMeters,
        Double totalDurationSeconds,
        List<List<Double>> routeCoordinates,
        LocalDateTime dispatchedAt,
        LocalDateTime estimatedArrival,
        boolean arrived) {}
