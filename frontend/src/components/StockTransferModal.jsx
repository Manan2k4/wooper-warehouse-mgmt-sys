import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { X, Check } from 'lucide-react';

export default function StockTransferModal({ isOpen, onClose, onCreated }) {
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [destLocations, setDestLocations] = useState([]);
  const [formData, setFormData] = useState({ product: '', destinationWarehouse: '', destinationLocation: '', reasonNote: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      api.get('/products').then(res => setProducts(res.data.data)).catch(console.error);
      api.get('/warehouses').then(res => setWarehouses(res.data.data)).catch(console.error);
      setFormData({ product: '', destinationWarehouse: '', destinationLocation: '', reasonNote: '' });
      setError('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.destinationWarehouse) {
      api.get(`/warehouses/${formData.destinationWarehouse}/locations`).then(res => setDestLocations(res.data.data)).catch(console.error);
    } else {
      setDestLocations([]);
    }
  }, [formData.destinationWarehouse]);

  if (!isOpen) return null;

  const selectedProduct = products.find(p => p._id === formData.product);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedProduct) {
      setError('Select a product to transfer');
      return;
    }
    if (selectedProduct.stock.reserved > 0) {
      setError(`${selectedProduct.name} has ${selectedProduct.stock.reserved} units reserved for dispatch and cannot be relocated right now`);
      return;
    }

    setLoading(true);
    try {
      await api.post('/stock-transfers', {
        product: formData.product,
        destinationWarehouse: formData.destinationWarehouse,
        destinationLocation: formData.destinationLocation || undefined,
        quantity: selectedProduct.stock.available,
        reasonNote: formData.reasonNote
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to request stock transfer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900">Request Stock Transfer</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="mt-3 text-xs text-slate-600 font-medium bg-slate-50 border border-slate-200 rounded-xl p-3">
          A product lives at a single warehouse/bin at a time, so a transfer always relocates its full available quantity — partial splits aren't supported.
        </p>

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
                <option key={p._id} value={p._id}>
                  {p.name} ({p.sku}) — {p.warehouse?.name} / {p.location?.code || 'Unassigned'} — {p.stock.available} avail.
                </option>
              ))}
            </select>
          </div>

          {selectedProduct && (
            <div className="text-xs bg-indigo-50 text-indigo-700 rounded-lg p-3">
              Transferring <strong>{selectedProduct.stock.available} {selectedProduct.unit}</strong> from{' '}
              <strong>{selectedProduct.warehouse?.name}</strong> ({selectedProduct.location?.code || 'Unassigned'})
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Destination Warehouse *</label>
              <select
                required
                value={formData.destinationWarehouse}
                onChange={e => setFormData({ ...formData, destinationWarehouse: e.target.value, destinationLocation: '' })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
              >
                <option value="">Select Warehouse</option>
                {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Destination Bin</label>
              <select
                value={formData.destinationLocation}
                onChange={e => setFormData({ ...formData, destinationLocation: e.target.value })}
                disabled={!formData.destinationWarehouse}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none disabled:bg-slate-50"
              >
                <option value="">Unassigned</option>
                {destLocations.map(l => <option key={l._id} value={l._id}>{l.code}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Reason / Notes</label>
            <textarea
              value={formData.reasonNote}
              onChange={e => setFormData({ ...formData, reasonNote: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
              placeholder="e.g. Rebalancing stock ahead of regional demand"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold text-sm">Cancel</button>
            <button type="submit" disabled={loading} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition flex items-center gap-2 text-sm shadow-lg shadow-indigo-600/20">
              {loading ? 'Submitting...' : <><Check className="w-4 h-4" /> Request Transfer</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
