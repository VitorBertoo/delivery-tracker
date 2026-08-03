import { useEffect, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { TrackingData } from '../types';

export function useTracking(orderId: number) {
  const [tracking, setTracking] = useState<TrackingData | null>(null);

  useEffect(() => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL as string;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${baseUrl}/ws`) as WebSocket,
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/topic/tracking/${orderId}`, (msg) => {
          setTracking(JSON.parse(msg.body) as TrackingData);
        });
      },
    });

    client.activate();
    return () => { client.deactivate(); };
  }, [orderId]);

  return tracking;
}
