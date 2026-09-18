import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import PurchaseOrderModal from '../components/PurchaseOrderModal';
import Badge from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';
import { Search, Plus, ClipboardList } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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

export default function PurchaseOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      const res = await api.get(`/purchase-orders?${params.toString()}`);
      setOrders(res.data.data);
    } catch (err) {
      console.error('Failed to load purchase orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status]);

  const canCreate = ['super_admin', 'warehouse_manager'].includes(user?.role);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Purchase Orders</h1>
          <p className="text-sm text-slate-500 mt-1">Track vendor orders from placement through receiving</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition text-sm shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" /> New Purchase Order
          </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="flex items-center gap-3 flex-1">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by PO number or vendor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm outline-none text-slate-700 font-medium"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="text-sm font-semibold border border-slate-200 rounded-xl px-3 py-2 outline-none text-slate-600"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="partially_received">Partially Received</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">PO Number</th>
                <th className="px-5 py-3.5">Vendor</th>
                <th className="px-5 py-3.5">Warehouse</th>
                <th className="px-5 py-3.5">Expected Date</th>
                <th className="px-5 py-3.5 w-40">Progress</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((po) => (
                <tr key={po._id} className="hover:bg-indigo-50/30 transition">
                  <td className="px-5 py-4">
                    <Link to={`/purchase-orders/${po._id}`} className="font-bold text-indigo-600 hover:text-indigo-700 font-mono text-xs">
                      {po.poNumber}
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-bold text-slate-800">{po.vendor?.name}</div>
                    <div className="text-xs text-slate-400">{po.vendor?.contactEmail}</div>
                  </td>
                  <td className="px-5 py-4 text-xs font-semibold">{po.warehouse?.name || 'N/A'}</td>
                  <td className="px-5 py-4 text-xs font-semibold">{po.expectedDate ? new Date(po.expectedDate).toLocaleDateString() : '-'}</td>
                  <td className="px-5 py-4">
                    <ProgressBar value={po.totalReceivedQty} max={po.totalOrderedQty} tone="indigo" />
                  </td>
                  <td className="px-5 py-4">
                    <Badge tone={STATUS_TONE[po.status]} dot>{STATUS_LABELS[po.status]}</Badge>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && !loading && (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-slate-400">
                    <ClipboardList className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No purchase orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PurchaseOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={fetchOrders}
      />
    </div>
  );
}
