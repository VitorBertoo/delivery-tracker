import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getOrder, getTracking, startTracking, updateStatus } from '../api/orders';
import { StatusBadge } from '../components/StatusBadge';
import { useTracking } from '../hooks/useTracking';
import type { Order, OrderStatus, TrackingData } from '../types';

const STATUS_OPTIONS: OrderStatus[] = [
  'RECEBIDO',
  'EM_PREPARO',
  'SAIU_PARA_ENTREGA',
  'ENTREGUE',
  'CANCELADO',
];

const STATUS_LABELS: Record<OrderStatus, string> = {
  RECEBIDO: 'Recebido',
  EM_PREPARO: 'Em preparo',
  SAIU_PARA_ENTREGA: 'Saiu para entrega',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
};

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const orderId = parseInt(id!);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('RECEBIDO');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [savedTracking, setSavedTracking] = useState<TrackingData | null>(null);
  const [trackingNotFound, setTrackingNotFound] = useState(false);
  const [trackingForm, setTrackingForm] = useState({
    originLat: '',
    originLng: '',
    destLat: '',
    destLng: '',
  });
  const [startingTracking, setStartingTracking] = useState(false);
  const [trackingError, setTrackingError] = useState('');

  const liveTracking = useTracking(orderId);
  const tracking = liveTracking ?? savedTracking;

  useEffect(() => {
    getOrder(orderId)
      .then((o) => {
        setOrder(o);
        setSelectedStatus(o.status);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    getTracking(orderId)
      .then(setSavedTracking)
      .catch(() => setTrackingNotFound(true));
  }, [orderId]);

  async function handleStatusUpdate() {
    if (!order) return;
    setUpdatingStatus(true);
    try {
      const updated = await updateStatus(orderId, selectedStatus);
      setOrder(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleStartTracking(e: React.FormEvent) {
    e.preventDefault();
    setTrackingError('');
    setStartingTracking(true);
    try {
      const data = await startTracking(orderId, {
        originLat: parseFloat(trackingForm.originLat),
        originLng: parseFloat(trackingForm.originLng),
        destLat: parseFloat(trackingForm.destLat),
        destLng: parseFloat(trackingForm.destLng),
      });
      setSavedTracking(data);
      setTrackingNotFound(false);
    } catch (err) {
      setTrackingError(err instanceof Error ? err.message : 'Erro ao iniciar rastreio.');
    } finally {
      setStartingTracking(false);
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
          <section className="card">
            <h2>Atualizar status</h2>
            <div className="status-update-row">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
              <button
                className="btn btn-primary"
                onClick={handleStatusUpdate}
                disabled={updatingStatus || selectedStatus === order.status}
              >
                {updatingStatus ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </section>

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
            ) : trackingNotFound ? (
              <form onSubmit={handleStartTracking} className="form">
                <p className="muted">Nenhum rastreio iniciado para este pedido.</p>
                <div className="field-row">
                  <div className="field">
                    <label>Origem lat</label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="-23.5505"
                      value={trackingForm.originLat}
                      onChange={(e) =>
                        setTrackingForm({ ...trackingForm, originLat: e.target.value })
                      }
                    />
                  </div>
                  <div className="field">
                    <label>Origem lng</label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="-46.6333"
                      value={trackingForm.originLng}
                      onChange={(e) =>
                        setTrackingForm({ ...trackingForm, originLng: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="field-row">
                  <div className="field">
                    <label>Destino lat</label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="-23.5614"
                      value={trackingForm.destLat}
                      onChange={(e) =>
                        setTrackingForm({ ...trackingForm, destLat: e.target.value })
                      }
                    />
                  </div>
                  <div className="field">
                    <label>Destino lng</label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="-46.6558"
                      value={trackingForm.destLng}
                      onChange={(e) =>
                        setTrackingForm({ ...trackingForm, destLng: e.target.value })
                      }
                    />
                  </div>
                </div>
                {trackingError && <p className="error-msg">{trackingError}</p>}
                <button type="submit" className="btn btn-primary" disabled={startingTracking}>
                  {startingTracking ? 'Iniciando...' : 'Iniciar rastreio'}
                </button>
              </form>
            ) : (
              <p className="muted">Carregando rastreio...</p>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
