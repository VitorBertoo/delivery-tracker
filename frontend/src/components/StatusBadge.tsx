import type { OrderStatus } from '../types';

const labels: Record<OrderStatus, string> = {
  RECEBIDO: 'Recebido',
  EM_PREPARO: 'Em preparo',
  SAIU_PARA_ENTREGA: 'Saiu para entrega',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`status-badge status-${status}`}>{labels[status]}</span>;
}
