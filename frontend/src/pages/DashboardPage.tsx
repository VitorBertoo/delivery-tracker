import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createOrder, getOrders } from '../api/orders';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import type { CreateOrderPayload, Order, OrderItemDraft } from '../types';

const EMPTY_FORM: CreateOrderPayload = {
  clientName: '',
  clientPhone: '',
  deliveryStreet: '',
  deliveryNumber: '',
  deliveryComplement: '',
  deliveryNeighborhood: '',
  deliveryCity: '',
  deliveryState: '',
  deliveryZip: '',
  items: [{ productName: '', unitPrice: 0, quantity: 1 }],
};

export function DashboardPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<CreateOrderPayload>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    getOrders()
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function updateItem(index: number, field: keyof OrderItemDraft, value: string | number) {
    setForm((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, items };
    });
  }

  function addItem() {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { productName: '', unitPrice: 0, quantity: 1 }],
    }));
  }

  function removeItem(index: number) {
    setForm((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const created = await createOrder(form);
      setOrders((prev) => [created, ...prev]);
      setShowModal(false);
      setForm(EMPTY_FORM);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao criar pedido.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <header className="topbar">
        <span className="topbar-title">Rastreador de Pedidos</span>
        <div className="topbar-actions">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Novo Pedido
          </button>
          <button className="btn btn-ghost" onClick={logout}>
            Sair
          </button>
        </div>
      </header>

      <main className="main-content">
        {loading ? (
          <p className="muted">Carregando pedidos...</p>
        ) : orders.length === 0 ? (
          <p className="muted">Nenhum pedido encontrado.</p>
        ) : (
          <div className="orders-grid">
            {orders.map((order) => (
              <button
                key={order.id}
                className="order-card"
                onClick={() => navigate(`/orders/${order.id}`)}
              >
                <div className="order-card-header">
                  <span className="order-client">{order.clientName}</span>
                  <StatusBadge status={order.status} />
                </div>
                <div className="order-card-body">
                  <span className="order-city">
                    {order.deliveryCity}
                    {order.deliveryState ? `, ${order.deliveryState}` : ''}
                  </span>
                  <span className="order-total">
                    {order.totalAmount != null
                      ? `R$ ${Number(order.totalAmount).toFixed(2)}`
                      : '—'}
                  </span>
                </div>
                <span className="order-date">
                  {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </button>
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Novo Pedido</h2>
              <button className="btn-close" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="form modal-form">
              <fieldset>
                <legend>Cliente</legend>
                <div className="field-row">
                  <div className="field">
                    <label>Nome do cliente</label>
                    <input
                      required
                      value={form.clientName}
                      onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label>Telefone</label>
                    <input
                      value={form.clientPhone}
                      onChange={(e) => setForm({ ...form, clientPhone: e.target.value })}
                    />
                  </div>
                </div>
              </fieldset>

              <fieldset>
                <legend>Endereço de entrega</legend>
                <div className="field-row">
                  <div className="field field-grow">
                    <label>Rua</label>
                    <input
                      value={form.deliveryStreet}
                      onChange={(e) => setForm({ ...form, deliveryStreet: e.target.value })}
                    />
                  </div>
                  <div className="field field-sm">
                    <label>Número</label>
                    <input
                      value={form.deliveryNumber}
                      onChange={(e) => setForm({ ...form, deliveryNumber: e.target.value })}
                    />
                  </div>
                </div>
                <div className="field-row">
                  <div className="field">
                    <label>Complemento</label>
                    <input
                      value={form.deliveryComplement}
                      onChange={(e) => setForm({ ...form, deliveryComplement: e.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label>Bairro</label>
                    <input
                      value={form.deliveryNeighborhood}
                      onChange={(e) =>
                        setForm({ ...form, deliveryNeighborhood: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="field-row">
                  <div className="field field-grow">
                    <label>Cidade</label>
                    <input
                      value={form.deliveryCity}
                      onChange={(e) => setForm({ ...form, deliveryCity: e.target.value })}
                    />
                  </div>
                  <div className="field field-sm">
                    <label>Estado</label>
                    <input
                      maxLength={2}
                      value={form.deliveryState}
                      onChange={(e) => setForm({ ...form, deliveryState: e.target.value })}
                    />
                  </div>
                  <div className="field field-sm">
                    <label>CEP</label>
                    <input
                      value={form.deliveryZip}
                      onChange={(e) => setForm({ ...form, deliveryZip: e.target.value })}
                    />
                  </div>
                </div>
              </fieldset>

              <fieldset>
                <legend>Itens</legend>
                {form.items.map((item, i) => (
                  <div key={i} className="item-row">
                    <div className="field field-grow">
                      <label>Produto</label>
                      <input
                        required
                        value={item.productName}
                        onChange={(e) => updateItem(i, 'productName', e.target.value)}
                      />
                    </div>
                    <div className="field field-sm">
                      <label>Preço</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={item.unitPrice}
                        onChange={(e) => updateItem(i, 'unitPrice', parseFloat(e.target.value))}
                      />
                    </div>
                    <div className="field field-xs">
                      <label>Qtd</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={item.quantity}
                        onChange={(e) => updateItem(i, 'quantity', parseInt(e.target.value))}
                      />
                    </div>
                    {form.items.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-icon"
                        onClick={() => removeItem(i)}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" className="btn btn-ghost" onClick={addItem}>
                  + Adicionar item
                </button>
              </fieldset>

              {formError && <p className="error-msg">{formError}</p>}

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Salvando...' : 'Criar Pedido'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
