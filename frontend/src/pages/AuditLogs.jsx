import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Search } from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/audit')
      .then(res => setLogs(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredLogs = logs.filter(l => 
    l.userName?.toLowerCase().includes(search.toLowerCase()) || 
    l.action?.toLowerCase().includes(search.toLowerCase()) ||
    l.entityType?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Immutable Audit Trail</h1>
        <p className="text-sm text-slate-500">Tamper-evident logs of all system operations, logins, and inventory changes</p>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400" />
        <input 
          type="text" 
          placeholder="Filter by user, action, or entity..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-sm outline-none text-slate-700"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-5 py-3.5">Timestamp</th>
              <th className="px-5 py-3.5">User & Role</th>
              <th className="px-5 py-3.5">Action</th>
              <th className="px-5 py-3.5">Entity</th>
              <th className="px-5 py-3.5">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono text-xs">
            {filteredLogs.map(l => (
              <tr key={l._id} className="hover:bg-slate-50/50">
                <td className="px-5 py-3 text-slate-500">{new Date(l.createdAt).toLocaleString()}</td>
                <td className="px-5 py-3 font-sans">
                  <span className="font-semibold text-slate-800">{l.userName}</span>
                  <span className="text-xs text-indigo-600 ml-1.5">({l.userRole})</span>
                </td>
                <td className="px-5 py-3 font-semibold text-indigo-600">{l.action}</td>
                <td className="px-5 py-3 text-slate-700">{l.entityType}</td>
                <td className="px-5 py-3 text-slate-400">{l.ipAddress}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
