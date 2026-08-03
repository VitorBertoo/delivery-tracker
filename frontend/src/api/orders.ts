import { apiFetch } from './client';
import type {
  CreateOrderPayload,
  Order,
  OrderHistoryEntry,
  OrderStatus,
  TrackingData,
} from '../types';

export const getOrders = () => apiFetch<Order[]>('/orders');

export const getOrder = (id: number) => apiFetch<Order>(`/orders/${id}`);

export const createOrder = (payload: CreateOrderPayload) =>
  apiFetch<Order>('/orders', { method: 'POST', body: JSON.stringify(payload) });

export const updateStatus = (id: number, status: OrderStatus) =>
  apiFetch<Order>(`/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

export const getHistory = (id: number) =>
  apiFetch<OrderHistoryEntry[]>(`/orders/${id}/history`);

export const startTracking = (
  id: number,
  payload: { originLat: number; originLng: number }
) =>
  apiFetch<TrackingData>(`/orders/${id}/tracking`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const getTracking = (id: number) =>
  apiFetch<TrackingData>(`/orders/${id}/tracking`);
