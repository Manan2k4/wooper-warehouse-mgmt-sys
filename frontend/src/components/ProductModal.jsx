import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { X, Check } from 'lucide-react';

export default function ProductModal({ isOpen, onClose, onCreated }) {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    warehouse: '',
    brand: '',
    unit: 'PCS',
    costPrice: '',
    sellingPrice: '',
    reorderLevel: 10,
    availableStock: 0,
    batchNumber: ''
  });
  const [categories, setCategories] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      api.get('/products/categories').then(res => setCategories(res.data.data)).catch(console.error);
      api.get('/warehouses').then(res => setWarehouses(res.data.data)).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/products', {
        ...formData,
        costPrice: Number(formData.costPrice),
        sellingPrice: Number(formData.sellingPrice),
        reorderLevel: Number(formData.reorderLevel),
        stock: { available: Number(formData.availableStock), reserved: 0, damaged: 0, returned: 0 }
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900">Add New Inventory Product</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && <div className="mt-4 p-3 bg-red-50 text-red-600 text-xs rounded-xl font-medium">{error}</div>}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-sm">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Product Name *</label>
            <input 
              type="text" 
              required 
              value={formData.name} 
              onChange={e => setFormData({ ...formData, name: e.target.value })} 
              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" 
              placeholder="e.g. Cordless Impact Driver"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Category *</label>
              <select 
                required 
                value={formData.category} 
                onChange={e => setFormData({ ...formData, category: e.target.value })} 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Category</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.name} ({c.code})</option>)}
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Warehouse *</label>
              <select 
                required 
                value={formData.warehouse} 
                onChange={e => setFormData({ ...formData, warehouse: e.target.value })} 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Warehouse</option>
                {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Brand</label>
              <input 
                type="text" 
                value={formData.brand} 
                onChange={e => setFormData({ ...formData, brand: e.target.value })} 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" 
                placeholder="Brand"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Cost Price ($) *</label>
              <input 
                type="number" 
                step="0.01" 
                required 
                value={formData.costPrice} 
                onChange={e => setFormData({ ...formData, costPrice: e.target.value })} 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" 
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Selling Price ($) *</label>
              <input 
                type="number" 
                step="0.01" 
                required 
                value={formData.sellingPrice} 
                onChange={e => setFormData({ ...formData, sellingPrice: e.target.value })} 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" 
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Initial Stock</label>
              <input 
                type="number" 
                value={formData.availableStock} 
                onChange={e => setFormData({ ...formData, availableStock: e.target.value })} 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" 
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Reorder Level</label>
              <input 
                type="number" 
                value={formData.reorderLevel} 
                onChange={e => setFormData({ ...formData, reorderLevel: e.target.value })} 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" 
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Unit</label>
              <select 
                value={formData.unit} 
                onChange={e => setFormData({ ...formData, unit: e.target.value })} 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
              >
                <option value="PCS">PCS</option>
                <option value="BOX">BOX</option>
                <option value="KG">KG</option>
                <option value="LITRE">LITRE</option>
                <option value="PALLET">PALLET</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold text-sm">Cancel</button>
            <button type="submit" disabled={loading} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition flex items-center gap-2 text-sm shadow-lg shadow-indigo-600/20">
              {loading ? 'Creating...' : <><Check className="w-4 h-4" /> Save Product</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
