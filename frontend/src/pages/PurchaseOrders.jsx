import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import PurchaseOrderModal from '../components/PurchaseOrderModal';
import { Search, Plus, ClipboardList } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
          <h1 className="text-2xl font-bold text-slate-800">Purchase Orders</h1>
          <p className="text-sm text-slate-500">Track vendor orders from placement through receiving</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition text-sm"
          >
            <Plus className="w-4 h-4" /> New Purchase Order
          </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="flex items-center gap-3 flex-1">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by PO number or vendor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm outline-none text-slate-700"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none text-slate-600"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="partially_received">Partially Received</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">PO Number</th>
                <th className="px-5 py-3.5">Vendor</th>
                <th className="px-5 py-3.5">Warehouse</th>
                <th className="px-5 py-3.5">Expected Date</th>
                <th className="px-5 py-3.5">Progress</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((po) => (
                <tr key={po._id} className="hover:bg-slate-50/50 transition">
                  <td className="px-5 py-4">
                    <Link to={`/purchase-orders/${po._id}`} className="font-semibold text-indigo-600 hover:text-indigo-700 font-mono text-xs">
                      {po.poNumber}
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-medium text-slate-800">{po.vendor?.name}</div>
                    <div className="text-xs text-slate-400">{po.vendor?.contactEmail}</div>
                  </td>
                  <td className="px-5 py-4 text-xs">{po.warehouse?.name || 'N/A'}</td>
                  <td className="px-5 py-4 text-xs">{po.expectedDate ? new Date(po.expectedDate).toLocaleDateString() : '-'}</td>
                  <td className="px-5 py-4 text-xs">
                    <span className="font-semibold text-slate-800">{po.totalReceivedQty}</span>
                    <span className="text-slate-400"> / {po.totalOrderedQty} units</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[po.status]}`}>
                      {STATUS_LABELS[po.status]}
                    </span>
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
