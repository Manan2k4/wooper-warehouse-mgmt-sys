import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { X, Check, Plus, Trash2 } from 'lucide-react';

const emptyItem = { product: '', orderedQty: '', unitCost: '' };

export default function PurchaseOrderModal({ isOpen, onClose, onCreated }) {
  const [formData, setFormData] = useState({
    vendorName: '',
    vendorEmail: '',
    vendorPhone: '',
    warehouse: '',
    expectedDate: '',
    notes: ''
  });
  const [items, setItems] = useState([{ ...emptyItem }]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      api.get('/warehouses').then(res => setWarehouses(res.data.data)).catch(console.error);
      setFormData({ vendorName: '', vendorEmail: '', vendorPhone: '', warehouse: '', expectedDate: '', notes: '' });
      setItems([{ ...emptyItem }]);
      setError('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.warehouse) {
      api.get(`/products?warehouse=${formData.warehouse}`).then(res => setProducts(res.data.data)).catch(console.error);
    } else {
      setProducts([]);
    }
  }, [formData.warehouse]);

  if (!isOpen) return null;

  const updateItem = (index, field, value) => {
    setItems(prev => prev.map((it, i) => i === index ? { ...it, [field]: value } : it));
  };

  const addItemRow = () => setItems(prev => [...prev, { ...emptyItem }]);
  const removeItemRow = (index) => setItems(prev => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const validItems = items.filter(it => it.product && it.orderedQty && it.unitCost);
    if (validItems.length === 0) {
      setError('Add at least one line item with product, quantity, and unit cost');
      setLoading(false);
      return;
    }

    try {
      await api.post('/purchase-orders', {
        vendor: { name: formData.vendorName, contactEmail: formData.vendorEmail, contactPhone: formData.vendorPhone },
        warehouse: formData.warehouse,
        expectedDate: formData.expectedDate,
        notes: formData.notes,
        items: validItems.map(it => ({
          product: it.product,
          orderedQty: Number(it.orderedQty),
          unitCost: Number(it.unitCost)
        }))
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create purchase order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">New Purchase Order</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && <div className="mt-4 p-3 bg-red-50 text-red-600 text-xs rounded-lg">{error}</div>}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Receiving Warehouse *</label>
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
            <div>
              <label className="block font-medium text-slate-700 mb-1">Expected Delivery Date *</label>
              <input
                type="date"
                required
                value={formData.expectedDate}
                onChange={e => setFormData({ ...formData, expectedDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Vendor Name *</label>
              <input
                type="text"
                required
                value={formData.vendorName}
                onChange={e => setFormData({ ...formData, vendorName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                placeholder="e.g. ScanPro Tech"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Contact Email</label>
              <input
                type="email"
                value={formData.vendorEmail}
                onChange={e => setFormData({ ...formData, vendorEmail: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                placeholder="sales@vendor.com"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Contact Phone</label>
              <input
                type="text"
                value={formData.vendorPhone}
                onChange={e => setFormData({ ...formData, vendorPhone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                placeholder="+1-555-0100"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block font-medium text-slate-700">Order Items *</label>
              <button
                type="button"
                onClick={addItemRow}
                disabled={!formData.warehouse}
                className="flex items-center gap-1 text-indigo-600 text-xs font-medium hover:text-indigo-700 disabled:text-slate-300"
              >
                <Plus className="w-3.5 h-3.5" /> Add Line
              </button>
            </div>
            {!formData.warehouse && (
              <p className="text-xs text-slate-400 mb-2">Select a warehouse to choose products.</p>
            )}
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <select
                    value={item.product}
                    onChange={e => updateItem(idx, 'product', e.target.value)}
                    className="col-span-6 px-2 py-2 border border-slate-300 rounded-lg outline-none text-xs"
                  >
                    <option value="">Select Product</option>
                    {products.map(p => <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}
                  </select>
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={item.orderedQty}
                    onChange={e => updateItem(idx, 'orderedQty', e.target.value)}
                    className="col-span-2 px-2 py-2 border border-slate-300 rounded-lg outline-none text-xs"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Unit Cost"
                    value={item.unitCost}
                    onChange={e => updateItem(idx, 'unitCost', e.target.value)}
                    className="col-span-3 px-2 py-2 border border-slate-300 rounded-lg outline-none text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => removeItemRow(idx)}
                    disabled={items.length === 1}
                    className="col-span-1 p-2 text-slate-400 hover:text-red-500 disabled:opacity-30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
              placeholder="Optional notes for this order..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition flex items-center gap-2">
              {loading ? 'Creating...' : <><Check className="w-4 h-4" /> Create Purchase Order</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
