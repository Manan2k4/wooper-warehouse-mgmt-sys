import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Warehouse as WarehouseIcon, MapPin, Box } from 'lucide-react';

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/warehouses')
      .then(res => setWarehouses(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Facilities & Warehouses</h1>
        <p className="text-sm text-slate-500">Manage distribution centers, zones, racks, and bin locations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {warehouses.map(w => (
          <div key={w._id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <WarehouseIcon className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-lg text-slate-900">{w.name}</h3>
                </div>
                <span className="inline-block mt-1 font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                  {w.code}
                </span>
              </div>
              <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-semibold">Active</span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-500 border-t border-slate-100 pt-3">
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>{w.address?.street || ''}, {w.address?.city || ''}, {w.address?.state || ''} {w.address?.postalCode || ''}</span>
              </p>
              <p className="flex items-center gap-2">
                <Box className="w-4 h-4 text-slate-400" />
                <span>Storage Capacity: <strong>{w.capacitySqFt?.toLocaleString()} sq.ft</strong></span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
