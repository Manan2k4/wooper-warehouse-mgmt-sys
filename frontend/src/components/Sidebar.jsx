import React from 'react';
import { NavLink } from 'react-router-dom';
<<<<<<< HEAD
import {
  LayoutDashboard,
  Boxes,
  Warehouse,
  ShieldCheck,
  QrCode,
  LogOut,
  ClipboardList
=======
import { 
  LayoutDashboard, 
  Boxes, 
  Warehouse, 
  ShieldCheck, 
  QrCode, 
  LogOut 
>>>>>>> c5ab6591203fab52473828b672a57871a7dbebba
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ onScanClick }) {
  const { user, logout } = useAuth();

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Inventory', path: '/inventory', icon: Boxes },
<<<<<<< HEAD
    { label: 'Purchase Orders', path: '/purchase-orders', icon: ClipboardList },
=======
>>>>>>> c5ab6591203fab52473828b672a57871a7dbebba
    { label: 'Warehouses', path: '/warehouses', icon: Warehouse },
    { label: 'Audit Logs', path: '/audit', icon: ShieldCheck, roles: ['super_admin', 'auditor', 'warehouse_manager'] }
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between h-screen fixed left-0 top-0 border-r border-slate-800">
      <div>
        {/* Logo */}
        <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800 bg-slate-950">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
            W
          </div>
          <div>
            <span className="font-bold text-white text-base tracking-wide">WMS Core</span>
            <span className="block text-[10px] uppercase tracking-wider text-indigo-400 font-semibold">Distributor v1.0</span>
          </div>
        </div>

        {/* Barcode Quick Action */}
        <div className="p-4">
          <button 
            onClick={onScanClick}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 py-2.5 px-3 rounded-lg text-sm font-medium transition"
          >
            <QrCode className="w-4 h-4 text-indigo-400" />
            <span>Scan Barcode / QR</span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-3 space-y-1 mt-2">
          {navItems.map((item) => {
            if (item.roles && !item.roles.includes(user?.role)) return null;
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between">
          <div className="truncate pr-2">
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            <p className="text-xs text-indigo-400 capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
          <button 
            onClick={logout} 
            title="Log Out"
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
