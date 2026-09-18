import React, { useEffect, useState } from 'react';
import api from '../api/client';
import Badge from '../components/ui/Badge';
import { TrendingUp, TrendingDown, PackageX, CalendarClock, FileSpreadsheet, FileText, FileDown } from 'lucide-react';

const TABS = [
  { key: 'valuation', label: 'Stock Valuation' },
  { key: 'velocity', label: 'Fast / Slow Movers' },
  { key: 'expiry', label: 'Expiry Tracking' }
];

const EXPIRY_TONE = {
  expired: 'red',
  critical: 'amber',
  warning: 'blue',
  ok: 'emerald'
};

const downloadBlob = async (url, filename) => {
  const res = await api.get(url, { responseType: 'blob' });
  const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
};

export default function Reports() {
  const [activeTab, setActiveTab] = useState('valuation');
  const [method, setMethod] = useState('average');
  const [days, setDays] = useState(30);
  const [valuation, setValuation] = useState(null);
  const [velocity, setVelocity] = useState(null);
  const [expiry, setExpiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchValuation = async () => {
    const res = await api.get(`/reports/valuation?method=${method}`);
    setValuation(res.data);
  };
  const fetchVelocity = async () => {
    const res = await api.get(`/reports/velocity?days=${days}`);
    setVelocity(res.data);
  };
  const fetchExpiry = async () => {
    const res = await api.get('/reports/expiry');
    setExpiry(res.data);
  };

  useEffect(() => {
    setLoading(true);
    setError('');
    const load = activeTab === 'valuation' ? fetchValuation : activeTab === 'velocity' ? fetchVelocity : fetchExpiry;
    load().catch(err => setError(err.response?.data?.message || 'Failed to load report')).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, method, days]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Reports & Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">Stock valuation, movement velocity, and expiry tracking</p>
      </div>

      <div className="flex flex-wrap items-center gap-1 bg-white rounded-xl border border-slate-200 p-1.5 shadow-sm w-fit">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition ${
              activeTab === tab.key ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl font-semibold">{error}</div>}

      {activeTab === 'valuation' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <label className="text-slate-500 font-semibold">Costing Method:</label>
              <select value={method} onChange={e => setMethod(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-1.5 outline-none font-semibold">
                <option value="average">Average Cost</option>
                <option value="fifo">FIFO (from receiving history)</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={() => downloadBlob('/reports/export/inventory.csv', 'inventory-export.csv')} className="flex items-center gap-1.5 text-xs font-bold bg-white border border-slate-200 px-3 py-2 rounded-xl hover:bg-slate-50">
                <FileDown className="w-3.5 h-3.5" /> CSV
              </button>
              <button onClick={() => downloadBlob('/reports/export/inventory.xlsx', 'inventory-export.xlsx')} className="flex items-center gap-1.5 text-xs font-bold bg-white border border-slate-200 px-3 py-2 rounded-xl hover:bg-slate-50">
                <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
              </button>
              <button onClick={() => downloadBlob(`/reports/export/valuation.pdf?method=${method}`, 'stock-valuation-report.pdf')} className="flex items-center gap-1.5 text-xs font-bold bg-white border border-slate-200 px-3 py-2 rounded-xl hover:bg-slate-50">
                <FileText className="w-3.5 h-3.5" /> PDF
              </button>
            </div>
          </div>

          {valuation && (
            <>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <p className="text-[11px] text-slate-400 uppercase font-bold tracking-widest">Total Stock Valuation ({valuation.method.toUpperCase()})</p>
                <p className="text-4xl font-black text-slate-900 mt-1.5 tabular-nums">${valuation.totalValuation.toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3">SKU</th>
                      <th className="px-5 py-3">Product</th>
                      <th className="px-5 py-3">Warehouse</th>
                      <th className="px-5 py-3">Available Qty</th>
                      <th className="px-5 py-3">Unit Cost</th>
                      <th className="px-5 py-3">Valuation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {valuation.data.map(row => (
                      <tr key={row.productId} className="hover:bg-indigo-50/30 transition">
                        <td className="px-5 py-3 font-mono text-xs text-indigo-600 font-bold">{row.sku}</td>
                        <td className="px-5 py-3 font-bold text-slate-800">{row.name}</td>
                        <td className="px-5 py-3 text-xs font-semibold">{row.warehouse}</td>
                        <td className="px-5 py-3 font-semibold">{row.availableQty}</td>
                        <td className="px-5 py-3 font-semibold">${row.costPrice.toFixed(2)}</td>
                        <td className="px-5 py-3 font-black text-slate-900">${row.valuation.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'velocity' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <label className="text-slate-500 font-semibold">Window:</label>
            <select value={days} onChange={e => setDays(Number(e.target.value))} className="border border-slate-200 rounded-xl px-3 py-1.5 outline-none font-semibold">
              <option value={30}>Last 30 days</option>
              <option value={60}>Last 60 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>

          {velocity && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 font-bold text-sm text-slate-700 flex items-center gap-2 uppercase tracking-wide">
                  <TrendingUp className="w-4 h-4 text-emerald-600" /> Fast Movers
                </div>
                <ul className="divide-y divide-slate-100 text-sm max-h-96 overflow-y-auto">
                  {velocity.fastMovers.map(m => (
                    <li key={m.productId} className="px-4 py-2.5 flex justify-between">
                      <span className="text-slate-700 font-semibold">{m.name}</span>
                      <span className="font-black text-emerald-600">{m.unitsDispatched}</span>
                    </li>
                  ))}
                  {velocity.fastMovers.length === 0 && <li className="px-4 py-4 text-slate-400 text-xs font-medium">No dispatch activity in this window.</li>}
                </ul>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 font-bold text-sm text-slate-700 flex items-center gap-2 uppercase tracking-wide">
                  <TrendingDown className="w-4 h-4 text-amber-600" /> Slow Movers
                </div>
                <ul className="divide-y divide-slate-100 text-sm max-h-96 overflow-y-auto">
                  {velocity.slowMovers.map(m => (
                    <li key={m.productId} className="px-4 py-2.5 flex justify-between">
                      <span className="text-slate-700 font-semibold">{m.name}</span>
                      <span className="font-black text-amber-600">{m.unitsDispatched}</span>
                    </li>
                  ))}
                  {velocity.slowMovers.length === 0 && <li className="px-4 py-4 text-slate-400 text-xs font-medium">No dispatch activity in this window.</li>}
                </ul>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 font-bold text-sm text-slate-700 flex items-center gap-2 uppercase tracking-wide">
                  <PackageX className="w-4 h-4 text-red-500" /> Dead Stock
                </div>
                <ul className="divide-y divide-slate-100 text-sm max-h-96 overflow-y-auto">
                  {velocity.deadStock.map(m => (
                    <li key={m.productId} className="px-4 py-2.5 flex justify-between">
                      <span className="text-slate-700 font-semibold">{m.name}</span>
                      <span className="font-black text-slate-400">{m.availableQty} on hand</span>
                    </li>
                  ))}
                  {velocity.deadStock.length === 0 && <li className="px-4 py-4 text-slate-400 text-xs font-medium">Every product moved in this window.</li>}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'expiry' && expiry && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 font-bold text-sm text-slate-700 flex items-center gap-2 uppercase tracking-wide">
            <CalendarClock className="w-4 h-4 text-indigo-500" /> Shelf-Life Tracking
          </div>
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Warehouse</th>
                <th className="px-5 py-3">Available Qty</th>
                <th className="px-5 py-3">Expiry Date</th>
                <th className="px-5 py-3">Days Remaining</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expiry.data.map(row => (
                <tr key={row.productId} className="hover:bg-indigo-50/30 transition">
                  <td className="px-5 py-3">
                    <div className="font-bold text-slate-800">{row.name}</div>
                    <div className="text-xs font-mono text-indigo-600 font-semibold">{row.sku}</div>
                  </td>
                  <td className="px-5 py-3 text-xs font-semibold">{row.warehouse}</td>
                  <td className="px-5 py-3 font-semibold">{row.availableQty}</td>
                  <td className="px-5 py-3 text-xs font-semibold">{new Date(row.expiryDate).toLocaleDateString()}</td>
                  <td className="px-5 py-3 font-semibold">{row.daysUntilExpiry}</td>
                  <td className="px-5 py-3">
                    <Badge tone={EXPIRY_TONE[row.bucket]} dot>{row.bucket}</Badge>
                  </td>
                </tr>
              ))}
              {expiry.data.length === 0 && (
                <tr><td colSpan="6" className="text-center py-10 text-slate-400 font-medium">No products have an expiry date set.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
