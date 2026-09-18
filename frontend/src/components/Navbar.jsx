import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell } from 'lucide-react';

export default function Navbar() {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <span className="font-semibold text-slate-700">Facility:</span>
        <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md text-xs font-medium border border-slate-200">
          {user?.assignedWarehouse?.name || 'All Facilities (Global Admin)'}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition relative">
          <Bell className="w-5 h-5" />
          <span className="w-2 h-2 bg-indigo-600 rounded-full absolute top-2 right-2"></span>
        </button>

        <div className="h-8 w-px bg-slate-200"></div>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <span className="text-sm font-medium text-slate-700">{user?.name}</span>
        </div>
      </div>
    </header>
  );
}
