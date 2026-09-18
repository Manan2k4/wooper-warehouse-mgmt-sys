import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { X, Check, Plus, Trash2 } from 'lucide-react';

const emptyItem = { product: '', orderedQty: '', unitPrice: '' };

export default function DispatchOrderModal({ isOpen, onClose, onCreated }) {
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    warehouse: '',
    priority: 'medium',
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
      setFormData({ customerName: '', customerEmail: '', customerPhone: '', customerAddress: '', warehouse: '', priority: 'medium', notes: '' });
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

  const availableFor = (productId) => products.find(p => p._id === productId)?.stock?.available;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const validItems = items.filter(it => it.product && it.orderedQty && it.unitPrice);
    if (validItems.length === 0) {
      setError('Add at least one line item with product, quantity, and unit price');
      setLoading(false);
      return;
    }

    try {
      await api.post('/dispatch-orders', {
        customer: {
          name: formData.customerName,
          email: formData.customerEmail,
          phone: formData.customerPhone,
          address: formData.customerAddress
        },
        warehouse: formData.warehouse,
        priority: formData.priority,
        notes: formData.notes,
        items: validItems.map(it => ({
          product: it.product,
          orderedQty: Number(it.orderedQty),
          unitPrice: Number(it.unitPrice)
        }))
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create dispatch order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900">New Dispatch Order</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && <div className="mt-4 p-3 bg-red-50 text-red-600 text-xs rounded-xl font-semibold">{error}</div>}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Fulfilling Warehouse *</label>
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
              <label className="block font-medium text-slate-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Customer Name *</label>
              <input
                type="text"
                required
                value={formData.customerName}
                onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                placeholder="e.g. Acme Retail Co."
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Contact Email</label>
              <input
                type="email"
                value={formData.customerEmail}
                onChange={e => setFormData({ ...formData, customerEmail: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                placeholder="orders@customer.com"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Contact Phone</label>
              <input
                type="text"
                value={formData.customerPhone}
                onChange={e => setFormData({ ...formData, customerPhone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                placeholder="+1-555-0100"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Delivery Address</label>
              <input
                type="text"
                value={formData.customerAddress}
                onChange={e => setFormData({ ...formData, customerAddress: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                placeholder="Street, City, State"
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
              {items.map((item, idx) => {
                const available = availableFor(item.product);
                const overStock = item.product && item.orderedQty && available !== undefined && Number(item.orderedQty) > available;
                return (
                  <div key={idx}>
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <select
                        value={item.product}
                        onChange={e => updateItem(idx, 'product', e.target.value)}
                        className="col-span-6 px-2 py-2 border border-slate-300 rounded-lg outline-none text-xs"
                      >
                        <option value="">Select Product</option>
                        {products.map(p => (
                          <option key={p._id} value={p._id}>{p.name} ({p.sku}) — {p.stock?.available} avail.</option>
                        ))}
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
                        placeholder="Unit Price"
                        value={item.unitPrice}
                        onChange={e => updateItem(idx, 'unitPrice', e.target.value)}
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
                    {overStock && (
                      <p className="text-[11px] text-red-500 mt-0.5 ml-1">Only {available} units available — reduce quantity</p>
                    )}
                  </div>
                );
              })}
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
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold text-sm">Cancel</button>
            <button type="submit" disabled={loading} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition flex items-center gap-2 text-sm shadow-lg shadow-indigo-600/20">
              {loading ? 'Creating...' : <><Check className="w-4 h-4" /> Create & Reserve Stock</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
