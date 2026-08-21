import React, { useEffect, useState } from 'react';
import api from '../api/client';
import StatCard from '../components/StatCard';
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

  if (loading) return <div className="p-8 text-slate-500">Loading WMS Dashboard...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Warehouse Overview</h1>
        <p className="text-sm text-slate-500">Real-time inventory and distribution metrics</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard 
          title="Total Products" 
          value={stats?.totalProducts || 0} 
          icon={Package} 
          colorClass="bg-indigo-50 text-indigo-600" 
        />
        <StatCard 
          title="Available Stock" 
          value={stats?.totalAvailableStock?.toLocaleString() || 0} 
          icon={Boxes} 
          colorClass="bg-blue-50 text-blue-600" 
        />
        <StatCard 
          title="Stock Valuation" 
          value={`$${stats?.totalStockValuation?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}`} 
          icon={DollarSign} 
          colorClass="bg-emerald-50 text-emerald-600" 
        />
        <StatCard 
          title="Low / Out of Stock" 
          value={`${stats?.lowStockCount || 0} / ${stats?.outOfStockCount || 0}`} 
          subtitle="Items needing reorder"
          icon={AlertTriangle} 
          colorClass="bg-amber-50 text-amber-600" 
        />
      </div>

      {/* Activity & Warehouse Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              Live Immutable Audit Log Activity
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {stats?.recentActivities?.map((act) => (
              <div key={act._id} className="py-3 flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium text-slate-800">{act.userName}</span>
                  <span className="text-slate-500"> ({act.userRole}) performed </span>
                  <span className="font-semibold text-indigo-600">{act.action}</span>
                  <p className="text-xs text-slate-400">{act.entityType} • IP: {act.ipAddress}</p>
                </div>
                <span className="text-xs text-slate-400">{new Date(act.createdAt).toLocaleTimeString()}</span>
              </div>
            ))}
            {(!stats?.recentActivities || stats.recentActivities.length === 0) && (
              <p className="text-sm text-slate-400 py-4 text-center">No recent activity</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <WarehouseIcon className="w-5 h-5 text-emerald-600" />
            Active Facilities
          </h2>
          <div className="space-y-3">
            {stats?.warehouses?.map(w => (
              <div key={w.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-slate-800">{w.name}</h3>
                  <span className="text-xs font-mono bg-slate-200 px-2 py-0.5 rounded text-slate-700">{w.code}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Capacity: {w.capacitySqFt.toLocaleString()} sq.ft</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
