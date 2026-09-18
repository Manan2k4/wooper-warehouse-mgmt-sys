import React, { useEffect, useState } from 'react';
import api from '../api/client';
import Badge from '../components/ui/Badge';
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
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Facilities & Warehouses</h1>
        <p className="text-sm text-slate-500 mt-1">Manage distribution centers, zones, racks, and bin locations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {warehouses.map(w => (
          <div key={w._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <WarehouseIcon className="w-4.5 h-4.5 text-indigo-600" />
                  </div>
                  <h3 className="font-black text-lg text-slate-900">{w.name}</h3>
                </div>
                <span className="inline-block mt-2 font-mono text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-bold">
                  {w.code}
                </span>
              </div>
              <Badge tone="emerald" dot>Active</Badge>
            </div>

            <div className="space-y-2 text-xs text-slate-500 border-t border-slate-100 pt-3.5">
              <p className="flex items-center gap-2 font-medium">
                <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span>{w.address?.street || ''}, {w.address?.city || ''}, {w.address?.state || ''} {w.address?.postalCode || ''}</span>
              </p>
              <p className="flex items-center gap-2 font-medium">
                <Box className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span>Storage Capacity: <strong className="text-slate-700">{w.capacitySqFt?.toLocaleString()} sq.ft</strong></span>
              </p>
            </div>
          </div>
        ))}
        {warehouses.length === 0 && !loading && (
          <p className="text-sm text-slate-400 font-medium col-span-2 text-center py-10">No warehouses found.</p>
        )}
      </div>
    </div>
  );
}
