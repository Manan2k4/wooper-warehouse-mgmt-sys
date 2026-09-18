import React, { useEffect, useState } from 'react';
import api from '../api/client';
import StockAdjustmentModal from '../components/StockAdjustmentModal';
import Badge from '../components/ui/Badge';
import { Plus, Check, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const STATUS_TONE = {
  pending_approval: 'amber',
  approved: 'emerald',
  rejected: 'slate'
};

const REASON_LABELS = {
  damaged_in_transit: 'Damaged in Transit',
  expired: 'Expired',
  count_discrepancy: 'Cycle Count Discrepancy',
  write_off: 'Write-Off / Shrinkage'
};

export default function StockAdjustments() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/stock-adjustments');
      setRequests(res.data.data);
    } catch (err) {
      console.error('Failed to load stock adjustments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const canRequest = ['super_admin', 'warehouse_manager', 'warehouse_staff'].includes(user?.role);
  const canApprove = ['super_admin', 'warehouse_manager'].includes(user?.role);

  const runAction = async (id, action) => {
    setError('');
    setBusyId(id);
    try {
      await api.patch(`/stock-adjustments/${id}/${action}`);
      await fetchRequests();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action} request`);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Stock Adjustments</h1>
          <p className="text-sm text-slate-500 mt-1">Cycle counts, damage, expiry, and write-off requests requiring approval</p>
        </div>
        {canRequest && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition text-sm shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" /> New Adjustment Request
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl flex items-center gap-2 font-semibold">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Product</th>
                <th className="px-5 py-3.5">Reason</th>
                <th className="px-5 py-3.5">Quantity</th>
                <th className="px-5 py-3.5">Requested By</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map((r) => (
                <tr key={r._id} className="hover:bg-indigo-50/30 transition">
                  <td className="px-5 py-4">
                    <div className="font-bold text-slate-800">{r.product?.name}</div>
                    <div className="text-xs font-mono text-indigo-600 font-semibold">{r.product?.sku}</div>
                  </td>
                  <td className="px-5 py-4 text-xs font-semibold">{REASON_LABELS[r.reasonCode]}</td>
                  <td className="px-5 py-4 text-xs font-black">
                    {r.quantity} {r.reasonCode === 'count_discrepancy' && <span className="text-slate-400 font-normal">(counted)</span>}
                  </td>
                  <td className="px-5 py-4 text-xs font-semibold">{r.requestedBy?.name}</td>
                  <td className="px-5 py-4">
                    <Badge tone={STATUS_TONE[r.status]} dot>{r.status.replace('_', ' ')}</Badge>
                  </td>
                  <td className="px-5 py-4">
                    {r.status === 'pending_approval' && canApprove ? (
                      <div className="flex items-center gap-2">
                        <button disabled={busyId === r._id} onClick={() => runAction(r._id, 'approve')} className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100" title="Approve">
                          <Check className="w-4 h-4" />
                        </button>
                        <button disabled={busyId === r._id} onClick={() => runAction(r._id, 'reject')} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100" title="Reject">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {requests.length === 0 && !loading && (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-slate-400 font-medium">No stock adjustment requests found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <StockAdjustmentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onCreated={fetchRequests} />
    </div>
  );
}
