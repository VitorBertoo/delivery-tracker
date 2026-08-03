package com.vitorbertoo.delivery_tracker_backend.dto;

public record StartTrackingRequest(
        Double originLat, Double originLng, Double destLat, Double destLng) {}
