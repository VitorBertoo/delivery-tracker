package com.vitorbertoo.delivery_tracker_backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vitorbertoo.delivery_tracker_backend.dto.StartTrackingRequest;
import com.vitorbertoo.delivery_tracker_backend.dto.TrackingResponse;
import com.vitorbertoo.delivery_tracker_backend.model.Order;
import com.vitorbertoo.delivery_tracker_backend.model.OrderTracking;
import com.vitorbertoo.delivery_tracker_backend.repository.OrderTrackingRepository;
import com.vitorbertoo.delivery_tracker_backend.service.OsrmService.OsrmRouteResult;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class TrackingService {

    private final OrderTrackingRepository trackingRepository;
    private final OrderService orderService;
    private final OsrmService osrmService;
    private final NominatimService nominatimService;
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    public TrackingService(
            OrderTrackingRepository trackingRepository,
            OrderService orderService,
            OsrmService osrmService,
            NominatimService nominatimService,
            SimpMessagingTemplate messagingTemplate,
            ObjectMapper objectMapper) {
        this.trackingRepository = trackingRepository;
        this.orderService = orderService;
        this.osrmService = osrmService;
        this.nominatimService = nominatimService;
        this.messagingTemplate = messagingTemplate;
        this.objectMapper = objectMapper;
    }

    public TrackingResponse startTracking(Long orderId, StartTrackingRequest request) {
        Order order = orderService.getById(orderId);

        if (trackingRepository.existsByOrderId(orderId)) {
            throw new IllegalStateException("Tracking already started for order: " + orderId);
        }

        double[] dest = nominatimService.geocode(
                buildStreet(order), order.getDeliveryCity(), order.getDeliveryState());

        OsrmRouteResult route =
                osrmService.getRoute(
                        request.originLat(), request.originLng(), dest[0], dest[1]);

        String routeGeometryJson;
        try {
            routeGeometryJson = objectMapper.writeValueAsString(route.coordinates());
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize route geometry", e);
        }

        OrderTracking tracking =
                new OrderTracking(
                        orderId,
                        request.originLat(),
                        request.originLng(),
                        dest[0],
                        dest[1],
                        routeGeometryJson,
                        route.durationSeconds(),
                        route.distanceMeters());

        trackingRepository.save(tracking);
        return buildResponse(tracking);
    }

    public TrackingResponse getTracking(Long orderId) {
        OrderTracking tracking =
                trackingRepository
                        .findByOrderId(orderId)
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "No tracking found for order: " + orderId));
        return buildResponse(tracking);
    }

    public void broadcastAll() {
        trackingRepository.findAll().forEach(tracking -> {
            TrackingResponse response = buildResponse(tracking);
            messagingTemplate.convertAndSend(
                    "/topic/tracking/" + tracking.getOrderId(), response);
        });
    }

    private String buildStreet(Order order) {
        return Stream.of(order.getDeliveryStreet(), order.getDeliveryNumber())
                .filter(s -> s != null && !s.isBlank())
                .collect(Collectors.joining(", "));
    }

    private TrackingResponse buildResponse(OrderTracking tracking) {
        double elapsedSeconds =
                ChronoUnit.SECONDS.between(tracking.getDispatchedAt(), LocalDateTime.now());
        double progress = Math.min(elapsedSeconds / tracking.getTotalDurationSeconds(), 1.0);

        List<List<Double>> coordinates = parseCoordinates(tracking.getRouteGeometry());
        double[] current = interpolateAlongRoute(coordinates, progress);

        LocalDateTime estimatedArrival =
                tracking.getDispatchedAt()
                        .plusSeconds(tracking.getTotalDurationSeconds().longValue());

        return new TrackingResponse(
                tracking.getOrderId(),
                current[0],
                current[1],
                tracking.getOriginLat(),
                tracking.getOriginLng(),
                tracking.getDestLat(),
                tracking.getDestLng(),
                progress,
                tracking.getTotalDistanceMeters(),
                tracking.getTotalDurationSeconds(),
                coordinates,
                tracking.getDispatchedAt(),
                estimatedArrival,
                progress >= 1.0);
    }

    private double[] interpolateAlongRoute(List<List<Double>> coordinates, double progress) {
        if (progress <= 0 || coordinates.size() < 2) {
            return new double[] {coordinates.get(0).get(1), coordinates.get(0).get(0)};
        }
        if (progress >= 1) {
            int last = coordinates.size() - 1;
            return new double[] {coordinates.get(last).get(1), coordinates.get(last).get(0)};
        }

        double totalLength = 0;
        for (int i = 1; i < coordinates.size(); i++) {
            totalLength += segmentLength(coordinates, i);
        }

        double target = totalLength * progress;
        double accumulated = 0;

        for (int i = 1; i < coordinates.size(); i++) {
            double seg = segmentLength(coordinates, i);
            if (accumulated + seg >= target) {
                double t = (target - accumulated) / seg;
                double lat1 = coordinates.get(i - 1).get(1);
                double lng1 = coordinates.get(i - 1).get(0);
                double lat2 = coordinates.get(i).get(1);
                double lng2 = coordinates.get(i).get(0);
                return new double[] {lat1 + (lat2 - lat1) * t, lng1 + (lng2 - lng1) * t};
            }
            accumulated += seg;
        }

        int last = coordinates.size() - 1;
        return new double[] {coordinates.get(last).get(1), coordinates.get(last).get(0)};
    }

    private double segmentLength(List<List<Double>> coords, int i) {
        double lat1 = coords.get(i - 1).get(1);
        double lng1 = coords.get(i - 1).get(0);
        double lat2 = coords.get(i).get(1);
        double lng2 = coords.get(i).get(0);
        return haversine(lat1, lng1, lat2, lng2);
    }

    private double haversine(double lat1, double lng1, double lat2, double lng2) {
        double R = 6_371_000;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2)
                        + Math.cos(Math.toRadians(lat1))
                                * Math.cos(Math.toRadians(lat2))
                                * Math.sin(dLng / 2)
                                * Math.sin(dLng / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private List<List<Double>> parseCoordinates(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to parse route geometry", e);
        }
    }
}
