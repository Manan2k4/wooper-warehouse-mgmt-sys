import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import { Printer } from 'lucide-react';

export default function PrintDeliveryNote() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/dispatch-orders/${id}`)
      .then(res => setOrder(res.data.data))
      .catch(err => setError(err.response?.data?.message || 'Failed to load dispatch order'));
  }, [id]);

  if (error) return <div className="p-8 text-red-500 text-sm">{error}</div>;
  if (!order) return <div className="p-8 text-slate-400 text-sm">Loading delivery note...</div>;

  return (
    <div className="min-h-screen bg-slate-100 py-10 print:bg-white print:py-0">
      <div className="max-w-3xl mx-auto mb-4 flex justify-end print:hidden">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition text-sm"
        >
          <Printer className="w-4 h-4" /> Print / Save as PDF
        </button>
      </div>

      <div className="max-w-3xl mx-auto bg-white shadow-sm print:shadow-none p-10 border border-slate-200 print:border-0">
        <div className="flex items-start justify-between border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Delivery Note / Packing Slip</h1>
            <p className="text-sm text-slate-500 mt-1 font-mono">{order.orderNumber}</p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p className="font-semibold text-slate-700">WMS Core</p>
            <p>Distributor v1.0</p>
            <p>Printed {new Date().toLocaleString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 py-6 border-b border-slate-200 text-sm">
          <div>
            <p className="text-xs uppercase font-semibold text-slate-400 mb-1">Ship To</p>
            <p className="font-medium text-slate-800">{order.customer?.name}</p>
            <p className="text-slate-500 text-xs">{order.customer?.address}</p>
            <p className="text-slate-500 text-xs">{order.customer?.email}</p>
            <p className="text-slate-500 text-xs">{order.customer?.phone}</p>
          </div>
          <div>
            <p className="text-xs uppercase font-semibold text-slate-400 mb-1">Shipped From</p>
            <p className="font-medium text-slate-800">{order.warehouse?.name}</p>
            <p className="text-slate-500 text-xs">
              {order.warehouse?.address?.street}, {order.warehouse?.address?.city}, {order.warehouse?.address?.state} {order.warehouse?.address?.postalCode}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase font-semibold text-slate-400 mb-1">Priority</p>
            <p className="font-medium text-slate-800 capitalize">{order.priority}</p>
          </div>
          <div>
            <p className="text-xs uppercase font-semibold text-slate-400 mb-1">Order Status</p>
            <p className="font-medium text-slate-800 capitalize">{order.status}</p>
          </div>
        </div>

        <table className="w-full text-left text-sm mt-6">
          <thead>
            <tr className="border-b-2 border-slate-800 text-xs uppercase text-slate-600">
              <th className="py-2">SKU</th>
              <th className="py-2">Product</th>
              <th className="py-2 text-right">Qty</th>
              <th className="py-2 text-right">Unit Price</th>
              <th className="py-2 text-right">Line Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.product._id} className="border-b border-slate-100">
                <td className="py-2.5 font-mono text-xs text-slate-500">{item.product.sku}</td>
                <td className="py-2.5 text-slate-800">{item.product.name}</td>
                <td className="py-2.5 text-right">{item.orderedQty}</td>
                <td className="py-2.5 text-right">${item.unitPrice.toFixed(2)}</td>
                <td className="py-2.5 text-right">${(item.orderedQty * item.unitPrice).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mt-4">
          <div className="w-56 text-sm">
            <div className="flex justify-between py-1 text-slate-600">
              <span>Total Units</span>
              <span>{order.totalOrderedQty}</span>
            </div>
            <div className="flex justify-between py-1 font-bold text-slate-900 border-t border-slate-200 mt-1 pt-2">
              <span>Order Value</span>
              <span>${order.totalValue?.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {order.notes && (
          <div className="mt-6 pt-4 border-t border-slate-200 text-xs text-slate-500">
            <p className="font-semibold text-slate-600 mb-1">Notes</p>
            {order.notes}
          </div>
        )}

        <div className="grid grid-cols-2 gap-8 mt-12 pt-6 border-t border-slate-200 text-xs">
          <div>
            <p className="border-t border-slate-400 pt-1 mt-8">Packed By (Signature)</p>
          </div>
          <div>
            <p className="border-t border-slate-400 pt-1 mt-8">Received By (Signature)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
