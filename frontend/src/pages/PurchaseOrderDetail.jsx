import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, PackageCheck, Printer, XCircle, AlertCircle, CheckCircle2 } from 'lucide-react';

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700',
  partially_received: 'bg-blue-50 text-blue-700',
  completed: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-slate-100 text-slate-500'
};

const STATUS_LABELS = {
  pending: 'Pending',
  partially_received: 'Partially Received',
  completed: 'Completed',
  cancelled: 'Cancelled'
};

export default function PurchaseOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [po, setPo] = useState(null);
  const [locations, setLocations] = useState([]);
  const [receiveQtys, setReceiveQtys] = useState({});
  const [receiveLocations, setReceiveLocations] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchPO = async () => {
    try {
      const res = await api.get(`/purchase-orders/${id}`);
      setPo(res.data.data);
      const locRes = await api.get(`/warehouses/${res.data.data.warehouse._id}/locations`);
      setLocations(locRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load purchase order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPO();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const canReceive = ['super_admin', 'warehouse_manager', 'warehouse_staff'].includes(user?.role);
  const canCancel = ['super_admin', 'warehouse_manager'].includes(user?.role);

  const handleReceive = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const items = Object.entries(receiveQtys)
      .filter(([, qty]) => qty && Number(qty) > 0)
      .map(([productId, qty]) => ({
        product: productId,
        receivedQty: Number(qty),
        location: receiveLocations[productId] || undefined
      }));

    if (items.length === 0) {
      setError('Enter a quantity for at least one item to receive');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.patch(`/purchase-orders/${id}/receive`, { items });
      setPo(res.data.data);
      setReceiveQtys({});
      setReceiveLocations({});
      setSuccess('Items received and stock updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to receive items');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel this purchase order? This cannot be undone.')) return;
    try {
      const res = await api.patch(`/purchase-orders/${id}/cancel`);
      setPo(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel purchase order');
    }
  };

  if (loading) return <div className="text-slate-400 text-sm">Loading purchase order...</div>;
  if (!po) return <div className="text-red-500 text-sm">{error || 'Purchase order not found'}</div>;

  const isReceivable = !['completed', 'cancelled'].includes(po.status);

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/purchase-orders')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="w-4 h-4" /> Back to Purchase Orders
      </button>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800 font-mono">{po.poNumber}</h1>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[po.status]}`}>
              {STATUS_LABELS[po.status]}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">{po.vendor?.name} &middot; Expected {new Date(po.expectedDate).toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/print/po/${po._id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition text-sm"
          >
            <Printer className="w-4 h-4" /> Print Receiving Slip
          </a>
          {canCancel && po.status === 'pending' && (
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 bg-white border border-red-200 text-red-600 px-4 py-2 rounded-lg font-medium hover:bg-red-50 transition text-sm"
            >
              <XCircle className="w-4 h-4" /> Cancel PO
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-400 uppercase font-semibold">Vendor</p>
          <p className="text-sm font-semibold text-slate-800 mt-1">{po.vendor?.name}</p>
          <p className="text-xs text-slate-500">{po.vendor?.contactEmail}</p>
          <p className="text-xs text-slate-500">{po.vendor?.contactPhone}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-400 uppercase font-semibold">Warehouse</p>
          <p className="text-sm font-semibold text-slate-800 mt-1">{po.warehouse?.name}</p>
          <p className="text-xs text-slate-500 font-mono">{po.warehouse?.code}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-400 uppercase font-semibold">Order Value</p>
          <p className="text-sm font-semibold text-slate-800 mt-1">${po.totalValue?.toFixed(2)}</p>
          <p className="text-xs text-slate-500">{po.totalReceivedQty} / {po.totalOrderedQty} units received</p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {success}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 font-semibold text-sm text-slate-700">
          Order Items
        </div>
        <form onSubmit={handleReceive}>
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Ordered</th>
                <th className="px-5 py-3">Received</th>
                <th className="px-5 py-3">Remaining</th>
                <th className="px-5 py-3">Unit Cost</th>
                {canReceive && isReceivable && <th className="px-5 py-3">Receive Qty</th>}
                {canReceive && isReceivable && <th className="px-5 py-3">Put-Away Bin</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {po.items.map((item) => {
                const remaining = item.orderedQty - item.receivedQty;
                return (
                  <tr key={item.product._id}>
                    <td className="px-5 py-3">
                      <div className="font-medium text-slate-800">{item.product.name}</div>
                      <div className="text-xs font-mono text-indigo-600">{item.product.sku}</div>
                    </td>
                    <td className="px-5 py-3">{item.orderedQty}</td>
                    <td className="px-5 py-3">{item.receivedQty}</td>
                    <td className="px-5 py-3">
                      <span className={remaining > 0 ? 'text-amber-600 font-semibold' : 'text-emerald-600 font-semibold'}>{remaining}</span>
                    </td>
                    <td className="px-5 py-3">${item.unitCost.toFixed(2)}</td>
                    {canReceive && isReceivable && (
                      <td className="px-5 py-3">
                        {remaining > 0 ? (
                          <input
                            type="number"
                            min="0"
                            max={remaining}
                            placeholder="0"
                            value={receiveQtys[item.product._id] || ''}
                            onChange={e => setReceiveQtys({ ...receiveQtys, [item.product._id]: e.target.value })}
                            className="w-20 px-2 py-1.5 border border-slate-300 rounded-lg outline-none text-xs"
                          />
                        ) : (
                          <span className="text-xs text-slate-300">Complete</span>
                        )}
                      </td>
                    )}
                    {canReceive && isReceivable && (
                      <td className="px-5 py-3">
                        {remaining > 0 && (
                          <select
                            value={receiveLocations[item.product._id] || ''}
                            onChange={e => setReceiveLocations({ ...receiveLocations, [item.product._id]: e.target.value })}
                            className="px-2 py-1.5 border border-slate-300 rounded-lg outline-none text-xs"
                          >
                            <option value="">Keep Current Bin</option>
                            {locations.map(l => <option key={l._id} value={l._id}>{l.code}</option>)}
                          </select>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {canReceive && isReceivable && (
            <div className="px-5 py-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition text-sm"
              >
                <PackageCheck className="w-4 h-4" /> {submitting ? 'Receiving...' : 'Receive Items & Update Stock'}
              </button>
            </div>
          )}
        </form>
      </div>

      {po.notes && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-sm text-slate-600">
          <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Notes</p>
          {po.notes}
        </div>
      )}
    </div>
  );
}
