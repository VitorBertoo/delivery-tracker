import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { TrackingData } from '../types';

// São Paulo center as [lng, lat] (MapLibre convention)
export const SAO_PAULO: [number, number] = [-46.67819919309489, -23.563098989056247];

interface Markers {
  origin?: maplibregl.Marker;
  dest?: maplibregl.Marker;
  current?: maplibregl.Marker;
}

function applyTracking(map: maplibregl.Map, markers: Markers, tracking: TrackingData) {
  const origin: [number, number] = [tracking.originLng, tracking.originLat];
  const dest: [number, number] = [tracking.destLng, tracking.destLat];
  const current: [number, number] = [tracking.currentLng, tracking.currentLat];

  if (!markers.origin) {
    markers.origin = new maplibregl.Marker({ color: '#aa3bff' })
      .setLngLat(origin)
      .setPopup(new maplibregl.Popup({ offset: 25 }).setText('Origem'))
      .addTo(map);
  } else {
    markers.origin.setLngLat(origin);
  }

  if (!markers.dest) {
    markers.dest = new maplibregl.Marker({ color: '#ef4444' })
      .setLngLat(dest)
      .setPopup(new maplibregl.Popup({ offset: 25 }).setText('Destino'))
      .addTo(map);
  } else {
    markers.dest.setLngLat(dest);
  }

  if (!markers.current) {
    const el = document.createElement('img');
    el.src = '/delivery_person.png';
    el.style.width = '40px';
    el.style.height = '40px';
    el.style.objectFit = 'contain';
    markers.current = new maplibregl.Marker({ element: el })
      .setLngLat(current)
      .setPopup(new maplibregl.Popup({ offset: 25 }).setText('Entregador'))
      .addTo(map);
  } else {
    markers.current.setLngLat(current);
  }

  if (tracking.routeCoordinates?.length > 0) {
    const geojsonData = {
      type: 'Feature' as const,
      geometry: {
        type: 'LineString' as const,
        coordinates: tracking.routeCoordinates,
      },
      properties: {},
    };

    if (map.getSource('route')) {
      (map.getSource('route') as maplibregl.GeoJSONSource).setData(geojsonData);
    } else {
      map.addSource('route', { type: 'geojson', data: geojsonData });
      map.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#aa3bff', 'line-width': 4, 'line-opacity': 0.8 },
      });
    }

    const bounds = tracking.routeCoordinates.reduce(
      (b, coord) => b.extend(coord as [number, number]),
      new maplibregl.LngLatBounds(
        tracking.routeCoordinates[0] as [number, number],
        tracking.routeCoordinates[0] as [number, number]
      )
    );
    map.fitBounds(bounds, { padding: 60, maxZoom: 16 });
  }
}

export function DeliveryMap({ tracking }: { tracking: TrackingData | null }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Markers>({});
  const styleLoadedRef = useRef(false);
  const pendingRef = useRef<TrackingData | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: SAO_PAULO,
      zoom: 12,
    });

    map.addControl(new maplibregl.NavigationControl());

    map.on('load', () => {
      styleLoadedRef.current = true;
      if (pendingRef.current) {
        applyTracking(map, markersRef.current, pendingRef.current);
        pendingRef.current = null;
      }
    });

    mapRef.current = map;

    return () => {
      Object.values(markersRef.current).forEach((m) => m?.remove());
      markersRef.current = {};
      map.remove();
      mapRef.current = null;
      styleLoadedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!tracking) return;

    if (!mapRef.current || !styleLoadedRef.current) {
      pendingRef.current = tracking;
      return;
    }

    applyTracking(mapRef.current, markersRef.current, tracking);
  }, [tracking]);

  return <div ref={containerRef} className="delivery-map" />;
}
