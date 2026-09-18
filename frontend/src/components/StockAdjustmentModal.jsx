import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { X, Check } from 'lucide-react';

const REASON_LABELS = {
  damaged_in_transit: 'Damaged in Transit',
  expired: 'Expired',
  count_discrepancy: 'Cycle Count Discrepancy',
  write_off: 'Write-Off / Shrinkage'
};

export default function StockAdjustmentModal({ isOpen, onClose, onCreated }) {
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({ product: '', reasonCode: 'damaged_in_transit', quantity: '', note: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      api.get('/products').then(res => setProducts(res.data.data)).catch(console.error);
      setFormData({ product: '', reasonCode: 'damaged_in_transit', quantity: '', note: '' });
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedProduct = products.find(p => p._id === formData.product);
  const isCount = formData.reasonCode === 'count_discrepancy';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.product || formData.quantity === '') {
      setError('Select a product and enter a quantity');
      return;
    }

    setLoading(true);
    try {
      await api.post('/stock-adjustments', {
        product: formData.product,
        reasonCode: formData.reasonCode,
        quantity: Number(formData.quantity),
        note: formData.note
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit adjustment request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900">Request Stock Adjustment</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && <div className="mt-4 p-3 bg-red-50 text-red-600 text-xs rounded-xl font-semibold">{error}</div>}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-sm">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Product *</label>
            <select
              required
              value={formData.product}
              onChange={e => setFormData({ ...formData, product: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select Product</option>
              {products.map(p => (
                <option key={p._id} value={p._id}>{p.name} ({p.sku}) — {p.stock.available} available</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Reason Code *</label>
            <select
              value={formData.reasonCode}
              onChange={e => setFormData({ ...formData, reasonCode: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
            >
              {Object.entries(REASON_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              {isCount ? 'Physically Counted Quantity *' : 'Quantity Affected *'}
            </label>
            {isCount && selectedProduct && (
              <p className="text-xs text-slate-400 mb-1">System currently shows {selectedProduct.stock.available} available</p>
            )}
            <input
              type="number"
              min="0"
              required
              value={formData.quantity}
              onChange={e => setFormData({ ...formData, quantity: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Note</label>
            <textarea
              value={formData.note}
              onChange={e => setFormData({ ...formData, note: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
              placeholder="Describe what was found during inspection/count..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold text-sm">Cancel</button>
            <button type="submit" disabled={loading} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition flex items-center gap-2 text-sm shadow-lg shadow-indigo-600/20">
              {loading ? 'Submitting...' : <><Check className="w-4 h-4" /> Submit for Approval</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
