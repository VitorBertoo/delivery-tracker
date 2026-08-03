package com.vitorbertoo.delivery_tracker_backend.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class TrackingScheduler {

    private final TrackingService trackingService;

    public TrackingScheduler(TrackingService trackingService) {
        this.trackingService = trackingService;
    }

    @Scheduled(fixedDelay = 5000)
    public void broadcastPositions() {
        trackingService.broadcastAll();
    }
}
