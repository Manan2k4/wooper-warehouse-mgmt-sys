import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import DispatchOrderModal from '../components/DispatchOrderModal';
import Badge from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';
import { Search, Plus, PackageSearch, LayoutGrid, List as ListIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const STATUS_TONE = {
  pending: 'amber',
  picking: 'blue',
  packed: 'purple',
  dispatched: 'indigo',
  delivered: 'emerald',
  cancelled: 'slate'
};

const PRIORITY_TONE = {
  low: 'slate',
  medium: 'blue',
  high: 'amber',
  urgent: 'red'
};

const BOARD_COLUMNS = [
  { key: 'pending', label: 'Pending' },
  { key: 'picking', label: 'Picking' },
  { key: 'packed', label: 'Packed' },
  { key: 'dispatched', label: 'Dispatched' },
  { key: 'delivered', label: 'Delivered' }
];

function orderProgress(order) {
  const totalOrdered = order.items.reduce((s, i) => s + i.orderedQty, 0);
  const isPackStage = ['picking', 'packed', 'dispatched', 'delivered'].includes(order.status);
  const done = order.items.reduce((s, i) => s + (isPackStage ? i.packedQty : i.pickedQty), 0);
  return { done, total: totalOrdered, label: isPackStage ? 'Packed' : 'Picked' };
}

function OrderCard({ order }) {
  const navigate = useNavigate();
  const progress = orderProgress(order);
  const priorityBorder = {
    urgent: 'border-l-red-500',
    high: 'border-l-amber-500',
    medium: 'border-l-blue-500',
    low: 'border-l-slate-300'
  }[order.priority];

  return (
    <button
      onClick={() => navigate(`/dispatch-orders/${order._id}`)}
      className={`w-full text-left bg-white rounded-xl border border-slate-200 border-l-4 ${priorityBorder} shadow-sm hover:shadow-md hover:-translate-y-0.5 transition p-3.5 space-y-2.5`}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs font-bold text-indigo-600">{order.orderNumber}</span>
        <Badge tone={PRIORITY_TONE[order.priority]}>{order.priority}</Badge>
      </div>
      <div>
        <p className="text-sm font-bold text-slate-800 truncate">{order.customer?.name}</p>
        <p className="text-xs text-slate-400 font-medium truncate">{order.warehouse?.name}</p>
      </div>
      <ProgressBar value={progress.done} max={progress.total} tone="indigo" label={progress.label} />
      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
        <span className="text-slate-400 font-semibold">{order.items.length} line{order.items.length !== 1 ? 's' : ''}</span>
        <span className="font-black text-slate-800 tabular-nums">${order.totalValue?.toFixed(2)}</span>
      </div>
    </button>
  );
}

export default function DispatchOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [view, setView] = useState('board');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      const res = await api.get(`/dispatch-orders?${params.toString()}`);
      setOrders(res.data.data);
    } catch (err) {
      console.error('Failed to load dispatch orders', err);
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
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Dispatch Orders</h1>
          <p className="text-sm text-slate-500 mt-1">Pick, pack, and ship customer orders from reserved stock</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition text-sm shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" /> New Dispatch Order
          </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="flex items-center gap-3 flex-1">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by order number or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm outline-none text-slate-700 font-medium"
          />
        </div>
        {view === 'table' && (
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="text-sm font-semibold border border-slate-200 rounded-xl px-3 py-2 outline-none text-slate-600"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="picking">Picking</option>
            <option value="packed">Packed</option>
            <option value="dispatched">Dispatched</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        )}
        <div className="flex bg-slate-100 rounded-xl p-1">
          <button
            onClick={() => setView('board')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${view === 'board' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Board
          </button>
          <button
            onClick={() => setView('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${view === 'table' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
          >
            <ListIcon className="w-3.5 h-3.5" /> Table
          </button>
        </div>
      </div>

      {view === 'board' ? (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {BOARD_COLUMNS.map(col => {
            const colOrders = orders.filter(o => o.status === col.key);
            return (
              <div key={col.key} className="flex-shrink-0 w-72">
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">{col.label}</h3>
                  <span className="text-xs font-black bg-slate-200 text-slate-700 rounded-full w-5 h-5 flex items-center justify-center">{colOrders.length}</span>
                </div>
                <div className="space-y-3 min-h-[100px]">
                  {colOrders.map(o => <OrderCard key={o._id} order={o} />)}
                  {colOrders.length === 0 && (
                    <div className="text-center py-8 text-xs text-slate-300 font-semibold border-2 border-dashed border-slate-200 rounded-xl">Empty</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Order Number</th>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Warehouse</th>
                  <th className="px-5 py-3.5">Priority</th>
                  <th className="px-5 py-3.5">Order Value</th>
                  <th className="px-5 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <tr key={o._id} className="hover:bg-indigo-50/30 transition">
                    <td className="px-5 py-4">
                      <Link to={`/dispatch-orders/${o._id}`} className="font-bold text-indigo-600 hover:text-indigo-700 font-mono text-xs">
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-800">{o.customer?.name}</div>
                      <div className="text-xs text-slate-400">{o.customer?.email}</div>
                    </td>
                    <td className="px-5 py-4 text-xs font-semibold">{o.warehouse?.name || 'N/A'}</td>
                    <td className="px-5 py-4">
                      <Badge tone={PRIORITY_TONE[o.priority]}>{o.priority}</Badge>
                    </td>
                    <td className="px-5 py-4 text-xs font-black text-slate-800">${o.totalValue?.toFixed(2)}</td>
                    <td className="px-5 py-4">
                      <Badge tone={STATUS_TONE[o.status]} dot>{o.status}</Badge>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && !loading && (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-slate-400">
                      <PackageSearch className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      No dispatch orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <DispatchOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={fetchOrders}
      />
    </div>
  );
}
