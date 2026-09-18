import React, { useState } from 'react';
import api from '../api/client';
import { X, Search, CheckCircle2, AlertCircle } from 'lucide-react';

export default function BarcodeModal({ isOpen, onClose }) {
  const [code, setCode] = useState('');
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    setProduct(null);

    try {
      const res = await api.get(`/products/barcode/${encodeURIComponent(code.trim())}`);
      setProduct(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Product not found');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Scan Barcode / SKU</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleLookup} className="mt-4">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Scan or Enter Code (Barcode, SKU)
          </label>
          <div className="flex gap-2">
            <input 
              type="text" 
              autoFocus
              value={code} 
              onChange={e => setCode(e.target.value)} 
              placeholder="e.g. BC-8829101 or ELEC-LOG-1001"
              className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
            <button 
              type="submit" 
              disabled={loading}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
            >
              {loading ? 'Searching...' : 'Scan'}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {product && (
          <div className="mt-5 p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-slate-900">{product.name}</h3>
                <p className="text-xs font-mono text-indigo-600 font-medium">{product.sku}</p>
              </div>
              {product.qrCodeData && (
                <img src={product.qrCodeData} alt="QR Code" className="w-14 h-14 border rounded-md" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200">
              <div>
                <span className="text-slate-500">Available:</span>
                <span className="font-bold text-slate-800 ml-1.5">{product.stock?.available} {product.unit}</span>
              </div>
              <div>
                <span className="text-slate-500">Warehouse:</span>
                <span className="font-medium text-slate-800 ml-1.5">{product.warehouse?.name || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500">Location Bin:</span>
                <span className="font-medium text-slate-800 ml-1.5">{product.location?.code || 'Unassigned'}</span>
              </div>
              <div>
                <span className="text-slate-500">Unit Price:</span>
                <span className="font-medium text-slate-800 ml-1.5">${product.sellingPrice?.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
