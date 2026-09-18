import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/ui/Badge';
import { ArrowLeft, Printer, XCircle, AlertCircle, CheckCircle2, ScanLine, Truck, PackageCheck } from 'lucide-react';

const STATUS_TONE = {
  pending: 'amber',
  picking: 'blue',
  packed: 'purple',
  dispatched: 'indigo',
  delivered: 'emerald',
  cancelled: 'slate'
};

export default function DispatchOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [pickSequence, setPickSequence] = useState([]);
  const [pickQtys, setPickQtys] = useState({});
  const [scanCode, setScanCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/dispatch-orders/${id}`);
      setOrder(res.data.data);
      setPickSequence(res.data.pickSequence || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dispatch order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const canAct = ['super_admin', 'warehouse_manager', 'warehouse_staff'].includes(user?.role);
  const canCancel = ['super_admin', 'warehouse_manager'].includes(user?.role);

  const handlePick = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const items = Object.entries(pickQtys)
      .filter(([, qty]) => qty && Number(qty) > 0)
      .map(([productId, qty]) => ({ product: productId, pickedQty: Number(qty) }));

    if (items.length === 0) {
      setError('Enter a quantity for at least one item to pick');
      return;
    }

    setSubmitting(true);
    try {
      await api.patch(`/dispatch-orders/${id}/pick`, { items });
      setPickQtys({});
      setSuccess('Items marked as picked.');
      await fetchOrder();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record picking');
    } finally {
      setSubmitting(false);
    }
  };

  const handleScanToPack = async (e) => {
    e.preventDefault();
    if (!scanCode.trim()) return;
    setError('');
    setSuccess('');

    const match = order.items.find(i => i.product.sku === scanCode.trim() || i.product.barcode === scanCode.trim());
    if (!match) {
      setError(`Scanned code "${scanCode}" does not match any item on this order — possible mispick`);
      setScanCode('');
      return;
    }

    setSubmitting(true);
    try {
      await api.patch(`/dispatch-orders/${id}/pack`, {
        items: [{ product: match.product._id, packedQty: 1 }]
      });
      setSuccess(`Packed 1x ${match.product.name}`);
      setScanCode('');
      await fetchOrder();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record packing');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransition = async (action) => {
    setError('');
    setSuccess('');
    try {
      const res = await api.patch(`/dispatch-orders/${id}/${action}`);
      setOrder(res.data.data);
      setSuccess(`Order ${action === 'dispatch' ? 'dispatched' : action === 'deliver' ? 'marked delivered' : 'updated'} successfully.`);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action} order`);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel this dispatch order? Reserved stock will be released back to available.')) return;
    try {
      const res = await api.patch(`/dispatch-orders/${id}/cancel`);
      setOrder(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel dispatch order');
    }
  };

  if (loading) return <div className="text-slate-400 text-sm font-medium">Loading dispatch order...</div>;
  if (!order) return <div className="text-red-500 text-sm font-medium">{error || 'Dispatch order not found'}</div>;

  const isPickable = ['pending', 'picking'].includes(order.status);
  const isPackable = ['picking', 'packed'].includes(order.status) && order.items.every(i => i.pickedQty >= i.orderedQty);

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/dispatch-orders')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 font-semibold">
        <ArrowLeft className="w-4 h-4" /> Back to Dispatch Orders
      </button>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 font-mono">{order.orderNumber}</h1>
            <Badge tone={STATUS_TONE[order.status]} dot>{order.status}</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1.5 font-medium">{order.customer?.name} &middot; {order.warehouse?.name}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={`/print/do/${order._id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition text-sm"
          >
            <Printer className="w-4 h-4" /> Print Delivery Note
          </a>
          {canAct && order.status === 'packed' && (
            <button onClick={() => handleTransition('dispatch')} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition text-sm shadow-lg shadow-indigo-600/20">
              <Truck className="w-4 h-4" /> Dispatch Order
            </button>
          )}
          {canAct && order.status === 'dispatched' && (
            <button onClick={() => handleTransition('deliver')} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition text-sm shadow-lg shadow-emerald-600/20">
              <CheckCircle2 className="w-4 h-4" /> Mark Delivered
            </button>
          )}
          {canCancel && order.status === 'pending' && (
            <button onClick={handleCancel} className="flex items-center gap-2 bg-white border border-red-200 text-red-600 px-4 py-2.5 rounded-xl font-bold hover:bg-red-50 transition text-sm">
              <XCircle className="w-4 h-4" /> Cancel Order
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl flex items-center gap-2 font-semibold">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-xl flex items-center gap-2 font-semibold">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {success}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 font-bold text-sm text-slate-700 uppercase tracking-wide">
          Pick List <span className="text-xs font-normal text-slate-400 normal-case tracking-normal">(sequenced by warehouse zone → rack → shelf → bin)</span>
        </div>
        <form onSubmit={handlePick}>
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Bin</th>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Ordered</th>
                <th className="px-5 py-3">Picked</th>
                <th className="px-5 py-3">Packed</th>
                {isPickable && <th className="px-5 py-3">Pick Qty</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pickSequence.map((item) => {
                const remaining = item.orderedQty - item.pickedQty;
                return (
                  <tr key={item.product._id}>
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs font-bold bg-slate-800 text-white px-2 py-0.5 rounded-md">{item.product.location?.code || 'Unassigned'}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-bold text-slate-800">{item.product.name}</div>
                      <div className="text-xs font-mono text-indigo-600 font-semibold">{item.product.sku}</div>
                    </td>
                    <td className="px-5 py-3 font-semibold">{item.orderedQty}</td>
                    <td className="px-5 py-3">
                      <span className={item.pickedQty >= item.orderedQty ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>{item.pickedQty}</span>
                    </td>
                    <td className="px-5 py-3 font-semibold">{item.packedQty}</td>
                    {isPickable && (
                      <td className="px-5 py-3">
                        {remaining > 0 ? (
                          <input
                            type="number"
                            min="0"
                            max={remaining}
                            placeholder="0"
                            value={pickQtys[item.product._id] || ''}
                            onChange={e => setPickQtys({ ...pickQtys, [item.product._id]: e.target.value })}
                            className="w-20 px-2 py-1.5 border border-slate-300 rounded-lg outline-none text-xs font-semibold"
                          />
                        ) : (
                          <span className="text-xs text-slate-300 font-semibold">Complete</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {isPickable && canAct && (
            <div className="px-5 py-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition text-sm shadow-lg shadow-indigo-600/20"
              >
                <PackageCheck className="w-4 h-4" /> {submitting ? 'Recording...' : 'Confirm Picked Items'}
              </button>
            </div>
          )}
        </form>
      </div>

      {isPackable && canAct && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-bold text-sm text-slate-800 mb-1 flex items-center gap-2 uppercase tracking-wide">
            <ScanLine className="w-4 h-4 text-indigo-500" /> Scan to Pack
          </h3>
          <p className="text-xs text-slate-500 mb-3 font-medium">Scan or type each item's barcode/SKU to confirm it's the correct pick before boxing it — mismatched codes are rejected.</p>
          <form onSubmit={handleScanToPack} className="flex gap-2">
            <input
              type="text"
              autoFocus
              value={scanCode}
              onChange={e => setScanCode(e.target.value)}
              placeholder="Scan barcode or SKU..."
              className="flex-1 px-3.5 py-3 text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
            />
            <button type="submit" disabled={submitting} className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/20">
              Pack
            </button>
          </form>
        </div>
      )}

      {order.notes && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-sm text-slate-600">
          <p className="text-[11px] text-slate-400 uppercase font-bold tracking-widest mb-1">Notes</p>
          {order.notes}
        </div>
      )}
    </div>
  );
}
