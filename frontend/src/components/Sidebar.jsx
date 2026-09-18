import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  Warehouse,
  ShieldCheck,
  QrCode,
  LogOut,
  ClipboardList,
  Truck,
  ArrowRightLeft,
  ClipboardCheck,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ onScanClick }) {
  const { user, logout } = useAuth();

  const sections = [
    {
      label: 'Operations',
      items: [
        { label: 'Dashboard', path: '/', icon: LayoutDashboard },
        { label: 'Inventory', path: '/inventory', icon: Boxes },
        { label: 'Purchase Orders', path: '/purchase-orders', icon: ClipboardList },
        { label: 'Dispatch Orders', path: '/dispatch-orders', icon: Truck },
        { label: 'Stock Transfers', path: '/stock-transfers', icon: ArrowRightLeft },
        { label: 'Stock Adjustments', path: '/stock-adjustments', icon: ClipboardCheck }
      ]
    },
    {
      label: 'Insights',
      items: [
        { label: 'Reports', path: '/reports', icon: BarChart3 }
      ]
    },
    {
      label: 'Administration',
      items: [
        { label: 'Warehouses', path: '/warehouses', icon: Warehouse },
        { label: 'Audit Logs', path: '/audit', icon: ShieldCheck, roles: ['super_admin', 'auditor', 'warehouse_manager'] }
      ]
    }
  ];

  return (
    <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col justify-between h-screen fixed left-0 top-0 border-r border-slate-900 overflow-y-auto">
      <div>
        <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-900 sticky top-0 bg-slate-950 z-10">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-600/30">
            W
          </div>
          <div>
            <span className="font-black text-white text-sm tracking-tight block leading-tight">WMS OPS</span>
            <span className="block text-[10px] uppercase tracking-widest text-indigo-400 font-bold">Console v2.0</span>
          </div>
        </div>

        <div className="p-4">
          <button
            onClick={onScanClick}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-3 px-3 rounded-xl text-sm font-bold transition shadow-lg shadow-indigo-600/20"
          >
            <QrCode className="w-4 h-4" />
            <span>Scan Barcode / QR</span>
          </button>
        </div>

        <nav className="px-3 space-y-5 mt-1 pb-4">
          {sections.map((section) => {
            const visibleItems = section.items.filter(item => !item.roles || item.roles.includes(user?.role));
            if (visibleItems.length === 0) return null;
            return (
              <div key={section.label}>
                <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-600">{section.label}</p>
                <div className="space-y-1">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/'}
                        className={({ isActive }) => `
                          flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                            isActive
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                              : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                          }
                        `}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        {item.label}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-900 bg-slate-950 sticky bottom-0">
        <div className="flex items-center justify-between">
          <div className="truncate pr-2">
            <p className="text-sm font-bold text-white truncate">{user?.name}</p>
            <p className="text-[11px] text-indigo-400 uppercase tracking-wide font-semibold">{user?.role?.replace('_', ' ')}</p>
          </div>
          <button
            onClick={logout}
            title="Log Out"
            className="p-2.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition flex-shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
