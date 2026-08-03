package com.vitorbertoo.delivery_tracker_backend.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.Duration;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class OsrmService {

    private final RestClient restClient;

    public OsrmService(@Value("${osrm.base-url}") String baseUrl) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(5));
        factory.setReadTimeout(Duration.ofSeconds(15));

        this.restClient = RestClient.builder().requestFactory(factory).baseUrl(baseUrl).build();
    }

    public OsrmRouteResult getRoute(
            double originLat, double originLng, double destLat, double destLng) {
        // OSRM expects coordinates as lng,lat
        String path =
                "/route/v1/driving/{oLng},{oLat};{dLng},{dLat}?overview=full&geometries=geojson";

        OsrmResponse response =
                restClient
                        .get()
                        .uri(path, originLng, originLat, destLng, destLat)
                        .header("Accept-Encoding", "identity")
                        .retrieve()
                        .body(OsrmResponse.class);

        if (response == null || response.routes().isEmpty()) {
            throw new IllegalStateException("OSRM returned no routes");
        }

        OsrmRoute route = response.routes().get(0);
        return new OsrmRouteResult(
                route.geometry().coordinates(), route.duration(), route.distance());
    }

    // -- internal DTOs for parsing OSRM JSON --

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record OsrmResponse(List<OsrmRoute> routes) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record OsrmRoute(OsrmGeometry geometry, double duration, double distance) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record OsrmGeometry(List<List<Double>> coordinates) {}

    public record OsrmRouteResult(
            List<List<Double>> coordinates, // [lng, lat] pairs
            double durationSeconds,
            double distanceMeters) {}
}
