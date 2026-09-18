import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 border border-slate-100">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-600/30">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">WMS Enterprise</h1>
          <p className="text-sm text-slate-500 mt-1">Distributor Warehouse Management System</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Work Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input 
                type="email" 
                required 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" 
                placeholder="name@wms.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input 
                type="password" 
                required 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" 
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition shadow-md shadow-indigo-600/20"
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
          </button>
        </form>

        {/* Quick RBAC Switch Buttons */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <p className="text-xs font-medium text-slate-400 text-center mb-2">Test with Seeded Accounts:</p>
          <div className="grid grid-cols-2 gap-2 text-xs font-medium">
            <button onClick={() => setRoleUser('admin@wms.com')} className="p-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition text-left">
              👑 Super Admin
            </button>
            <button onClick={() => setRoleUser('manager@wms.com')} className="p-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition text-left">
              📦 Manager
            </button>
            <button onClick={() => setRoleUser('staff@wms.com')} className="p-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition text-left">
              🛠️ Staff
            </button>
            <button onClick={() => setRoleUser('auditor@wms.com')} className="p-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition text-left">
              🔍 Auditor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
