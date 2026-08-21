import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, colorClass }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-xl ${colorClass || 'bg-blue-50 text-blue-600'}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
}
