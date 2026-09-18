import React, { useEffect, useState } from 'react';
import api from '../api/client';
import StockTransferModal from '../components/StockTransferModal';
import Badge from '../components/ui/Badge';
import { Plus, ArrowRightLeft, Check, X, Truck, PackageCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const STATUS_TONE = {
  requested: 'amber',
  approved: 'blue',
  in_transit: 'purple',
  completed: 'emerald',
  rejected: 'slate'
};

export default function StockTransfers() {
  const { user } = useAuth();
  const [transfers, setTransfers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const fetchTransfers = async () => {
    try {
      const res = await api.get('/stock-transfers');
      setTransfers(res.data.data);
    } catch (err) {
      console.error('Failed to load stock transfers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTransfers(); }, []);

  const canRequest = ['super_admin', 'warehouse_manager'].includes(user?.role);
  const canApprove = ['super_admin', 'warehouse_manager'].includes(user?.role);
  const canExecute = ['super_admin', 'warehouse_manager', 'warehouse_staff'].includes(user?.role);

  const runAction = async (id, action) => {
    setError('');
    setBusyId(id);
    try {
      await api.patch(`/stock-transfers/${id}/${action}`);
      await fetchTransfers();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action.replace('-', ' ')} transfer`);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Stock Transfers</h1>
          <p className="text-sm text-slate-500 mt-1">Relocate inventory between warehouses and bin locations</p>
        </div>
        {canRequest && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition text-sm shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" /> Request Transfer
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
                <th className="px-5 py-3.5">From</th>
                <th className="px-5 py-3.5">To</th>
                <th className="px-5 py-3.5">Qty</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transfers.map((t) => (
                <tr key={t._id} className="hover:bg-indigo-50/30 transition">
                  <td className="px-5 py-4">
                    <div className="font-bold text-slate-800">{t.product?.name}</div>
                    <div className="text-xs font-mono text-indigo-600 font-semibold">{t.product?.sku}</div>
                  </td>
                  <td className="px-5 py-4 text-xs font-semibold">
                    {t.sourceWarehouse?.name}<br /><span className="text-slate-400 font-mono">{t.sourceLocation?.code || '—'}</span>
                  </td>
                  <td className="px-5 py-4 text-xs font-semibold">
                    <span className="inline-flex items-center gap-1"><ArrowRightLeft className="w-3 h-3 text-slate-400" /> {t.destinationWarehouse?.name}</span><br />
                    <span className="text-slate-400 font-mono">{t.destinationLocation?.code || '—'}</span>
                  </td>
                  <td className="px-5 py-4 text-xs font-black">{t.quantity}</td>
                  <td className="px-5 py-4">
                    <Badge tone={STATUS_TONE[t.status]} dot>{t.status.replace('_', ' ')}</Badge>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {t.status === 'requested' && canApprove && (
                        <>
                          <button disabled={busyId === t._id} onClick={() => runAction(t._id, 'approve')} className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100" title="Approve">
                            <Check className="w-4 h-4" />
                          </button>
                          <button disabled={busyId === t._id} onClick={() => runAction(t._id, 'reject')} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100" title="Reject">
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {t.status === 'approved' && canExecute && (
                        <button disabled={busyId === t._id} onClick={() => runAction(t._id, 'in-transit')} className="flex items-center gap-1 px-2.5 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold hover:bg-purple-100" title="Mark In Transit">
                          <Truck className="w-3.5 h-3.5" /> Ship
                        </button>
                      )}
                      {t.status === 'in_transit' && canExecute && (
                        <button disabled={busyId === t._id} onClick={() => runAction(t._id, 'complete')} className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-100" title="Complete">
                          <PackageCheck className="w-3.5 h-3.5" /> Complete
                        </button>
                      )}
                      {['completed', 'rejected'].includes(t.status) && <span className="text-xs text-slate-300">—</span>}
                    </div>
                  </td>
                </tr>
              ))}
              {transfers.length === 0 && !loading && (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-slate-400 font-medium">No stock transfers found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <StockTransferModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onCreated={fetchTransfers} />
    </div>
  );
}
