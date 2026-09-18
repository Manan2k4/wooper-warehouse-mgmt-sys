import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { PackageSearch, Lock, Mail, Crown, PackageCheck, Wrench, ScanEye } from 'lucide-react';

const ROLE_BUTTONS = [
  { email: 'admin@wms.com', label: 'Super Admin', icon: Crown, tone: 'text-amber-400' },
  { email: 'manager@wms.com', label: 'Manager', icon: PackageCheck, tone: 'text-blue-400' },
  { email: 'staff@wms.com', label: 'Staff', icon: Wrench, tone: 'text-emerald-400' },
  { email: 'auditor@wms.com', label: 'Auditor', icon: ScanEye, tone: 'text-purple-400' }
];

export default function Login() {
  const [email, setEmail] = useState('admin@wms.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setRoleUser = (roleEmail) => {
    setEmail(roleEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.15),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(16,185,129,0.12),transparent_40%)]" />

      <div className="max-w-md w-full bg-slate-900 rounded-3xl shadow-2xl p-8 border border-slate-800 relative">
        <div className="text-center mb-7">
          <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-600/40">
            <PackageSearch className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">WMS OPS CONSOLE</h1>
          <p className="text-xs text-slate-400 mt-1.5 uppercase tracking-widest font-semibold">Fulfillment &amp; Distribution Control</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Work Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-sm bg-slate-800 border border-slate-700 text-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-500"
                placeholder="name@wms.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-sm bg-slate-800 border border-slate-700 text-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3.5 rounded-xl text-sm font-bold hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/30 uppercase tracking-wide"
          >
            {loading ? 'Authenticating...' : 'Sign In to Console'}
          </button>
        </form>

        <div className="mt-7 pt-6 border-t border-slate-800">
          <p className="text-[11px] font-bold text-slate-500 text-center mb-3 uppercase tracking-widest">Quick Access — Seeded Accounts</p>
          <div className="grid grid-cols-2 gap-2.5">
            {ROLE_BUTTONS.map(({ email: roleEmail, label, icon: Icon, tone }) => (
              <button
                key={roleEmail}
                onClick={() => setRoleUser(roleEmail)}
                className={`flex items-center gap-2 p-3 bg-slate-800 hover:bg-slate-700 border rounded-xl transition text-left ${email === roleEmail ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-700'}`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${tone}`} />
                <span className="text-xs font-semibold text-slate-200">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
