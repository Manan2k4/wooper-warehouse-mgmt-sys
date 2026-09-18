import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';
import { ArrowLeft, PackageCheck, Printer, XCircle, AlertCircle, CheckCircle2, ScanLine } from 'lucide-react';

const STATUS_TONE = {
  pending: 'amber',
  partially_received: 'blue',
  completed: 'emerald',
  cancelled: 'slate'
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
  const [scanCode, setScanCode] = useState('');
  const [scanBin, setScanBin] = useState('');
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

  const handleScanToReceive = async (e) => {
    e.preventDefault();
    if (!scanCode.trim()) return;
    setError('');
    setSuccess('');

    const match = po.items.find(i => i.product.sku === scanCode.trim() || i.product.barcode === scanCode.trim());
    if (!match) {
      setError(`Scanned code "${scanCode}" does not match any item on this purchase order`);
      setScanCode('');
      return;
    }
    if (match.receivedQty >= match.orderedQty) {
      setError(`${match.product.name} has already been fully received`);
      setScanCode('');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.patch(`/purchase-orders/${id}/receive`, {
        items: [{ product: match.product._id, receivedQty: 1, location: scanBin || undefined }]
      });
      setPo(res.data.data);
      setSuccess(`Received 1x ${match.product.name}`);
      setScanCode('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record receiving');
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

  if (loading) return <div className="text-slate-400 text-sm font-medium">Loading purchase order...</div>;
  if (!po) return <div className="text-red-500 text-sm font-medium">{error || 'Purchase order not found'}</div>;

  const isReceivable = !['completed', 'cancelled'].includes(po.status);

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/purchase-orders')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 font-semibold">
        <ArrowLeft className="w-4 h-4" /> Back to Purchase Orders
      </button>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 font-mono">{po.poNumber}</h1>
            <Badge tone={STATUS_TONE[po.status]} dot>{STATUS_LABELS[po.status]}</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1.5 font-medium">{po.vendor?.name} &middot; Expected {new Date(po.expectedDate).toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/print/po/${po._id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition text-sm"
          >
            <Printer className="w-4 h-4" /> Print Receiving Slip
          </a>
          {canCancel && po.status === 'pending' && (
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 bg-white border border-red-200 text-red-600 px-4 py-2.5 rounded-xl font-bold hover:bg-red-50 transition text-sm"
            >
              <XCircle className="w-4 h-4" /> Cancel PO
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[11px] text-slate-400 uppercase font-bold tracking-widest">Vendor</p>
          <p className="text-sm font-bold text-slate-800 mt-1.5">{po.vendor?.name}</p>
          <p className="text-xs text-slate-500 font-medium">{po.vendor?.contactEmail}</p>
          <p className="text-xs text-slate-500 font-medium">{po.vendor?.contactPhone}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[11px] text-slate-400 uppercase font-bold tracking-widest">Warehouse</p>
          <p className="text-sm font-bold text-slate-800 mt-1.5">{po.warehouse?.name}</p>
          <p className="text-xs text-slate-500 font-mono font-semibold">{po.warehouse?.code}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[11px] text-slate-400 uppercase font-bold tracking-widest">Order Value</p>
          <p className="text-2xl font-black text-slate-900 mt-1 tabular-nums">${po.totalValue?.toFixed(2)}</p>
          <ProgressBar value={po.totalReceivedQty} max={po.totalOrderedQty} tone="indigo" className="mt-2" />
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

      {canReceive && isReceivable && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-bold text-sm text-slate-800 mb-1 flex items-center gap-2 uppercase tracking-wide">
            <ScanLine className="w-4 h-4 text-indigo-500" /> Scan to Receive
          </h3>
          <p className="text-xs text-slate-500 mb-3 font-medium">Scan each carton's barcode/SKU as it comes off the truck to verify it against this PO and log receipt — mismatched codes are rejected before they hit inventory.</p>
          <form onSubmit={handleScanToReceive} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              autoFocus
              value={scanCode}
              onChange={e => setScanCode(e.target.value)}
              placeholder="Scan barcode or SKU..."
              className="flex-1 px-3.5 py-3 text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
            />
            <select
              value={scanBin}
              onChange={e => setScanBin(e.target.value)}
              className="px-3 py-3 text-sm border border-slate-300 rounded-xl outline-none font-semibold sm:w-48"
            >
              <option value="">Put-away bin (optional)</option>
              {locations.map(l => <option key={l._id} value={l._id}>{l.code}</option>)}
            </select>
            <button type="submit" disabled={submitting} className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/20">
              Receive
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 font-bold text-sm text-slate-700 uppercase tracking-wide">
          Order Items
        </div>
        <form onSubmit={handleReceive}>
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Ordered</th>
                <th className="px-5 py-3">Received</th>
                <th className="px-5 py-3">Remaining</th>
                <th className="px-5 py-3">Unit Cost</th>
                {canReceive && isReceivable && <th className="px-5 py-3">Manual Receive Qty</th>}
                {canReceive && isReceivable && <th className="px-5 py-3">Put-Away Bin</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {po.items.map((item) => {
                const remaining = item.orderedQty - item.receivedQty;
                return (
                  <tr key={item.product._id}>
                    <td className="px-5 py-3">
                      <div className="font-bold text-slate-800">{item.product.name}</div>
                      <div className="text-xs font-mono text-indigo-600 font-semibold">{item.product.sku}</div>
                    </td>
                    <td className="px-5 py-3 font-semibold">{item.orderedQty}</td>
                    <td className="px-5 py-3 font-semibold">{item.receivedQty}</td>
                    <td className="px-5 py-3">
                      <span className={remaining > 0 ? 'text-amber-600 font-bold' : 'text-emerald-600 font-bold'}>{remaining}</span>
                    </td>
                    <td className="px-5 py-3 font-semibold">${item.unitCost.toFixed(2)}</td>
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
                            className="w-20 px-2 py-1.5 border border-slate-300 rounded-lg outline-none text-xs font-semibold"
                          />
                        ) : (
                          <span className="text-xs text-slate-300 font-semibold">Complete</span>
                        )}
                      </td>
                    )}
                    {canReceive && isReceivable && (
                      <td className="px-5 py-3">
                        {remaining > 0 && (
                          <select
                            value={receiveLocations[item.product._id] || ''}
                            onChange={e => setReceiveLocations({ ...receiveLocations, [item.product._id]: e.target.value })}
                            className="px-2 py-1.5 border border-slate-300 rounded-lg outline-none text-xs font-semibold"
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
                className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition text-sm shadow-lg shadow-indigo-600/20"
              >
                <PackageCheck className="w-4 h-4" /> {submitting ? 'Receiving...' : 'Receive Items & Update Stock'}
              </button>
            </div>
          )}
        </form>
      </div>

      {po.notes && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-sm text-slate-600">
          <p className="text-[11px] text-slate-400 uppercase font-bold tracking-widest mb-1">Notes</p>
          {po.notes}
        </div>
      )}
    </div>
  );
}
