import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getOrder, getTracking, startTracking, updateStatus } from '../api/orders';
import { DeliveryMap, SAO_PAULO } from '../components/DeliveryMap';
import { StatusBadge } from '../components/StatusBadge';
import { useTracking } from '../hooks/useTracking';
import type { Order, OrderStatus, TrackingData } from '../types';

const STATUS_LABELS: Record<OrderStatus, string> = {
  RECEBIDO: 'Recebido',
  EM_PREPARO: 'Em preparo',
  SAIU_PARA_ENTREGA: 'Saiu para entrega',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
};

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  RECEBIDO: 'EM_PREPARO',
  EM_PREPARO: 'SAIU_PARA_ENTREGA',
};

const TERMINAL_STATUSES: OrderStatus[] = ['ENTREGUE', 'CANCELADO'];

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const orderId = parseInt(id!);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [savedTracking, setSavedTracking] = useState<TrackingData | null>(null);
  const [startingTracking, setStartingTracking] = useState(false);
  const [trackingError, setTrackingError] = useState('');

  const liveTracking = useTracking(orderId);
  const tracking = liveTracking ?? savedTracking;

  // Prevent auto-complete from firing more than once
  const autoCompletedRef = useRef(false);

  useEffect(() => {
    getOrder(orderId)
      .then(setOrder)
      .catch(console.error)
      .finally(() => setLoading(false));

    getTracking(orderId)
      .then(setSavedTracking)
      .catch(() => {});
  }, [orderId]);

  // Auto-complete order when delivery arrives
  useEffect(() => {
    if (liveTracking?.arrived && !autoCompletedRef.current) {
      autoCompletedRef.current = true;
      updateStatus(orderId, 'ENTREGUE')
        .then(setOrder)
        .catch(console.error);
    }
  }, [liveTracking?.arrived, orderId]);

  async function triggerStartTracking() {
    setStartingTracking(true);
    setTrackingError('');
    try {
      const data = await startTracking(orderId, {
        originLat: SAO_PAULO[1],
        originLng: SAO_PAULO[0],
      });
      setSavedTracking(data);
    } catch (err) {
      setTrackingError(err instanceof Error ? err.message : 'Erro ao iniciar rastreio.');
    } finally {
      setStartingTracking(false);
    }
  }

  async function handleNextStep() {
    if (!order) return;
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    setUpdatingStatus(true);
    try {
      const updated = await updateStatus(orderId, next);
      setOrder(updated);
      if (next === 'SAIU_PARA_ENTREGA') {
        await triggerStartTracking();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleCancel() {
    if (!order) return;
    setUpdatingStatus(true);
    try {
      const updated = await updateStatus(orderId, 'CANCELADO');
      setOrder(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingStatus(false);
    }
  }

  if (loading) return <div className="page"><p className="muted centered">Carregando...</p></div>;
  if (!order) return <div className="page"><p className="muted centered">Pedido não encontrado.</p></div>;

  const fullAddress = [
    order.deliveryStreet,
    order.deliveryNumber,
    order.deliveryComplement,
    order.deliveryNeighborhood,
    order.deliveryCity,
    order.deliveryState,
    order.deliveryZip,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="page">
      <header className="topbar">
        <button className="btn btn-ghost" onClick={() => navigate('/')}>
          ← Voltar
        </button>
        <span className="topbar-title">Pedido #{order.id}</span>
        <StatusBadge status={order.status} />
      </header>

      <main className="main-content detail-layout">
        <div className="detail-left">
          {/* Order info */}
          <section className="card">
            <h2>Informações do pedido</h2>
            <dl className="info-grid">
              <dt>Cliente</dt>
              <dd>{order.clientName}</dd>
              {order.clientPhone && (
                <>
                  <dt>Telefone</dt>
                  <dd>{order.clientPhone}</dd>
                </>
              )}
              <dt>Endereço</dt>
              <dd>{fullAddress || '—'}</dd>
              <dt>Total</dt>
              <dd>R$ {Number(order.totalAmount).toFixed(2)}</dd>
              <dt>Criado em</dt>
              <dd>{new Date(order.createdAt).toLocaleString('pt-BR')}</dd>
              <dt>Atualizado em</dt>
              <dd>{new Date(order.updatedAt).toLocaleString('pt-BR')}</dd>
            </dl>
          </section>

          {/* Status update */}
          {!TERMINAL_STATUSES.includes(order.status) && (
            <section className="card">
              <h2>Ações</h2>
              <div className="status-update-row">
                {NEXT_STATUS[order.status] && (
                  <button
                    className="btn btn-primary"
                    onClick={handleNextStep}
                    disabled={updatingStatus}
                  >
                    {updatingStatus
                      ? 'Aguarde...'
                      : `Avançar para ${STATUS_LABELS[NEXT_STATUS[order.status]!]}`}
                  </button>
                )}
                {order.status === 'SAIU_PARA_ENTREGA' && (
                  <p className="muted" style={{ fontSize: '13px' }}>
                    Entrega em andamento — status atualiza automaticamente.
  </p>
                )}
                <button
                  className="btn btn-danger"
                  onClick={handleCancel}
                  disabled={updatingStatus}
                >
                  Cancelar pedido
                </button>
              </div>
            </section>
          )}

          {/* Items */}
          {order.items.length > 0 && (
            <section className="card">
              <h2>Itens</h2>
              <table className="table">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Preço unit.</th>
                    <th>Qtd</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.productName}</td>
                      <td>R$ {Number(item.unitPrice).toFixed(2)}</td>
                      <td>{item.quantity}</td>
                      <td>R$ {Number(item.subtotal).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {/* History */}
          {order.history.length > 0 && (
            <section className="card">
              <h2>Histórico</h2>
              <ul className="timeline">
                {[...order.history]
                  .sort(
                    (a, b) =>
                      new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()
                  )
                  .map((entry) => (
                    <li key={entry.id} className="timeline-item">
                      <StatusBadge status={entry.status} />
                      <span className="timeline-meta">
                        {new Date(entry.changedAt).toLocaleString('pt-BR')}
                        {entry.changedBy && ` · ${entry.changedBy.name}`}
                      </span>
                    </li>
                  ))}
              </ul>
            </section>
          )}
        </div>

        {/* Tracking panel */}
        <div className="detail-right">
          <section className="card tracking-card">
            <h2>Rastreio</h2>

            {tracking ? (
              <div className="tracking-panel">
                <div className="tracking-progress-bar">
                  <div
                    className="tracking-progress-fill"
                    style={{ width: `${Math.round(tracking.progress * 100)}%` }}
                  />
                </div>
                <p className="tracking-progress-label">
                  {Math.round(tracking.progress * 100)}%{' '}
                  {tracking.arrived ? (
                    <span className="badge-arrived">Entregue</span>
                  ) : (
                    'concluído'
                  )}
                </p>

                <dl className="info-grid">
                  <dt>Posição atual</dt>
                  <dd>
                    {tracking.currentLat.toFixed(6)}, {tracking.currentLng.toFixed(6)}
                  </dd>
                  <dt>Distância total</dt>
                  <dd>{(tracking.totalDistanceMeters / 1000).toFixed(2)} km</dd>
                  <dt>Duração estimada</dt>
                  <dd>{Math.round(tracking.totalDurationSeconds / 60)} min</dd>
                  <dt>Saiu às</dt>
                  <dd>{new Date(tracking.dispatchedAt).toLocaleTimeString('pt-BR')}</dd>
                  <dt>Previsão de chegada</dt>
                  <dd>{new Date(tracking.estimatedArrival).toLocaleTimeString('pt-BR')}</dd>
                </dl>

                {!liveTracking && (
                  <p className="muted" style={{ marginTop: '8px', fontSize: '13px' }}>
                    Aguardando atualização em tempo real...
                  </p>
                )}
              </div>
            ) : order.status === 'SAIU_PARA_ENTREGA' ? (
              <div className="form">
                {trackingError ? (
                  <>
                    <p className="error-msg">{trackingError}</p>
                    <button
                      className="btn btn-primary"
                      onClick={triggerStartTracking}
                      disabled={startingTracking}
                    >
                      {startingTracking ? 'Tentando novamente...' : 'Tentar novamente'}
                    </button>
                  </>
                ) : (
                  <p className="muted">Iniciando rastreio...</p>
                )}
              </div>
            ) : (
              <p className="muted">O rastreio será iniciado automaticamente ao sair para entrega.</p>
            )}
          </section>
        </div>
      </main>

      <div className="main-content map-section">
        <section className="card">
          <h2>Mapa de entrega</h2>
          <DeliveryMap tracking={tracking} />
        </section>
      </div>
    </div>
  );
}
