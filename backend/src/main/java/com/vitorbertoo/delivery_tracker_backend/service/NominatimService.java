package com.vitorbertoo.delivery_tracker_backend.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class NominatimService {

    private final RestClient restClient;

    public NominatimService() {
        this.restClient =
                RestClient.builder()
                        .baseUrl("https://nominatim.openstreetmap.org")
                        .defaultHeader("User-Agent", "delivery-tracker-backend/1.0")
                        .defaultHeader("Accept-Language", "pt-BR")
                        .build();
    }

    public double[] geocode(String street, String city, String state) {
        // Try structured search first (more reliable than free-text)
        List<NominatimResult> results = searchStructured(street, city, state);

        // Fallback: city + state only (handles unknown street names)
        if (results == null || results.isEmpty()) {
            results = searchStructured(null, city, state);
        }

        if (results == null || results.isEmpty()) {
            throw new IllegalStateException(
                    "Could not geocode address: " + street + ", " + city + ", " + state);
        }

        NominatimResult result = results.get(0);
        return new double[] {Double.parseDouble(result.lat()), Double.parseDouble(result.lon())};
    }

    private List<NominatimResult> searchStructured(String street, String city, String state) {
        StringBuilder uri = new StringBuilder("/search?format=json&limit=1&countrycodes=br");
        if (street != null && !street.isBlank()) {
            uri.append("&street=").append(street);
        }
        if (city != null && !city.isBlank()) {
            uri.append("&city=").append(city);
        }
        if (state != null && !state.isBlank()) {
            uri.append("&state=").append(state);
        }

        return restClient
                .get()
                .uri(uri.toString())
                .header("Accept-Encoding", "identity")
                .retrieve()
                .body(new ParameterizedTypeReference<>() {});
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record NominatimResult(String lat, String lon) {}
}
