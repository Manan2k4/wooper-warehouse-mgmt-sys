import React, { useEffect, useState } from 'react';
import api from '../api/client';
import StatTile from '../components/ui/StatTile';
import { Package, AlertTriangle, Boxes, DollarSign, Activity, Warehouse as WarehouseIcon } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        setStats(res.data.data);
      } catch (err) {
        console.error('Failed to load dashboard stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="p-8 text-slate-500 font-medium">Loading Ops Overview...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Warehouse Overview</h1>
        <p className="text-sm text-slate-500 mt-1">Real-time inventory and distribution metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatTile label="Total Products" value={stats?.totalProducts || 0} icon={Package} tone="indigo" />
        <StatTile label="Available Stock" value={stats?.totalAvailableStock?.toLocaleString() || 0} icon={Boxes} tone="purple" />
        <StatTile
          label="Stock Valuation"
          value={`$${stats?.totalStockValuation?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}`}
          icon={DollarSign}
          tone="emerald"
        />
        <StatTile
          label="Low / Out of Stock"
          value={`${stats?.lowStockCount || 0} / ${stats?.outOfStockCount || 0}`}
          sub="Items needing reorder"
          icon={AlertTriangle}
          tone="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wide">
              <Activity className="w-4 h-4 text-indigo-600" />
              Live Audit Activity
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {stats?.recentActivities?.map((act) => (
              <div key={act._id} className="py-3 flex items-center justify-between text-sm">
                <div>
                  <span className="font-bold text-slate-800">{act.userName}</span>
                  <span className="text-slate-500"> ({act.userRole}) performed </span>
                  <span className="font-bold text-indigo-600">{act.action}</span>
                  <p className="text-xs text-slate-400 mt-0.5">{act.entityType} • IP: {act.ipAddress}</p>
                </div>
                <span className="text-xs text-slate-400 font-medium flex-shrink-0 ml-2">{new Date(act.createdAt).toLocaleTimeString()}</span>
              </div>
            ))}
            {(!stats?.recentActivities || stats.recentActivities.length === 0) && (
              <p className="text-sm text-slate-400 py-4 text-center">No recent activity</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
            <WarehouseIcon className="w-4 h-4 text-emerald-600" />
            Active Facilities
          </h2>
          <div className="space-y-3">
            {stats?.warehouses?.map(w => (
              <div key={w.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 text-sm">{w.name}</h3>
                  <span className="text-[10px] font-mono bg-slate-800 text-white px-2 py-0.5 rounded-full font-bold">{w.code}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1.5 font-medium">Capacity: {w.capacitySqFt.toLocaleString()} sq.ft</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
