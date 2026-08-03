export type OrderStatus =
  | 'RECEBIDO'
  | 'EM_PREPARO'
  | 'SAIU_PARA_ENTREGA'
  | 'ENTREGUE'
  | 'CANCELADO';

export interface OrderItem {
  id: number;
  orderId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface OrderHistoryEntry {
  id: number;
  orderId: number;
  status: OrderStatus;
  changedAt: string;
  changedBy: { id: number; name: string; email: string } | null;
}

export interface Order {
  id: number;
  clientName: string;
  clientPhone: string;
  status: OrderStatus;
  deliveryStreet: string;
  deliveryNumber: string;
  deliveryComplement: string;
  deliveryNeighborhood: string;
  deliveryCity: string;
  deliveryState: string;
  deliveryZip: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  history: OrderHistoryEntry[];
}

export interface TrackingData {
  orderId: number;
  currentLat: number;
  currentLng: number;
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  progress: number;
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  routeCoordinates: [number, number][];
  dispatchedAt: string;
  estimatedArrival: string;
  arrived: boolean;
}

export interface OrderItemDraft {
  productName: string;
  unitPrice: number;
  quantity: number;
}

export interface CreateOrderPayload {
  clientName: string;
  clientPhone: string;
  deliveryStreet: string;
  deliveryNumber: string;
  deliveryComplement: string;
  deliveryNeighborhood: string;
  deliveryCity: string;
  deliveryState: string;
  deliveryZip: string;
  items: OrderItemDraft[];
}
