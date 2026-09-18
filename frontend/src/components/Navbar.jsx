import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { Bell, AlertCircle, AlertTriangle, Info, Factory } from 'lucide-react';

const SEVERITY_ICON = {
  critical: <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />,
  warning: <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />,
  info: <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
};

export default function Navbar() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = () => {
    api.get('/notifications').then(res => setNotifications(res.data.data)).catch(console.error);
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const criticalCount = notifications.filter(n => n.severity === 'critical').length;

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-2.5 text-sm">
        <Factory className="w-4 h-4 text-slate-400" />
        <span className="font-bold text-slate-700">Facility:</span>
        <span className="bg-slate-100 text-slate-800 px-3 py-1 rounded-lg text-xs font-bold border border-slate-200">
          {user?.assignedWarehouse?.name || 'All Facilities · Global Admin'}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => { setIsOpen(o => !o); if (!isOpen) fetchNotifications(); }}
            className="p-2.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition relative"
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className={`min-w-[17px] h-[17px] px-1 rounded-full absolute top-1 right-1 text-white text-[10px] font-bold flex items-center justify-center ${criticalCount > 0 ? 'bg-red-500' : 'bg-indigo-600'}`}>
                {notifications.length > 9 ? '9+' : notifications.length}
              </span>
            )}
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-20">
              <div className="px-4 py-3 border-b border-slate-100 font-bold text-sm text-slate-700 bg-slate-50">
                Alerts {notifications.length > 0 && <span className="text-slate-400 font-normal">({notifications.length} open)</span>}
              </div>
              <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                {notifications.map((n, idx) => (
                  <Link
                    key={idx}
                    to={n.link}
                    onClick={() => setIsOpen(false)}
                    className="flex items-start gap-2.5 px-4 py-3 hover:bg-slate-50 transition text-xs"
                  >
                    {SEVERITY_ICON[n.severity]}
                    <span className="text-slate-700 font-medium">{n.message}</span>
                  </Link>
                ))}
                {notifications.length === 0 && (
                  <div className="px-4 py-8 text-center text-xs text-slate-400 font-medium">All caught up — no open alerts.</div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-slate-200"></div>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-md shadow-indigo-600/20">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-bold text-slate-800 leading-tight">{user?.name}</p>
            <p className="text-[10px] uppercase tracking-wide text-slate-400 font-bold">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
