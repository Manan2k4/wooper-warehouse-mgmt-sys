import React, { useEffect, useState } from 'react';
import api from '../api/client';
import ProductModal from '../components/ProductModal';
import { Search, Plus, QrCode, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Inventory() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const res = await api.get(`/products?search=${encodeURIComponent(search)}`);
      setProducts(res.data.data);
    } catch (err) {
      console.error('Failed to load inventory', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search]);

  const canEdit = ['super_admin', 'warehouse_manager'].includes(user?.role);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Inventory Catalog</h1>
          <p className="text-sm text-slate-500">Track stock levels, SKUs, and warehouse bin locations</p>
        </div>
        {canEdit && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition text-sm"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400" />
        <input 
          type="text" 
          placeholder="Search by Product Name, SKU, Brand, or Barcode..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-sm outline-none text-slate-700"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Product & SKU</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Facility / Bin</th>
                <th className="px-5 py-3.5">Cost / Sell</th>
                <th className="px-5 py-3.5">Available Stock</th>
                <th className="px-5 py-3.5">Stock Status</th>
                <th className="px-5 py-3.5 text-center">QR / Barcode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => {
                const isLow = p.stock?.available <= p.reorderLevel;
                const isOut = p.stock?.available === 0;
                return (
                  <tr key={p._id} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-800">{p.name}</div>
                      <div className="text-xs font-mono text-indigo-600">{p.sku} • {p.brand}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-md font-medium">
                        {p.category?.name || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-xs font-medium text-slate-800">{p.warehouse?.name || 'N/A'}</div>
                      <div className="text-xs font-mono text-slate-400">{p.location?.code || 'Unassigned'}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-xs text-slate-500">Cost: ${p.costPrice?.toFixed(2)}</div>
                      <div className="text-xs font-semibold text-emerald-600">Sell: ${p.sellingPrice?.toFixed(2)}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-bold text-slate-800">{p.stock?.available}</span>
                      <span className="text-xs text-slate-400 ml-1">{p.unit}</span>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Rsv: {p.stock?.reserved} | Dmg: {p.stock?.damaged}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {isOut ? (
                        <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 text-xs px-2.5 py-1 rounded-full font-medium">
                          <AlertCircle className="w-3.5 h-3.5" /> Out of Stock
                        </span>
                      ) : isLow ? (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-xs px-2.5 py-1 rounded-full font-medium">
                          <AlertCircle className="w-3.5 h-3.5" /> Low Stock ({p.stock?.available}/{p.reorderLevel})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs px-2.5 py-1 rounded-full font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Healthy
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {p.qrCodeData ? (
                        <button 
                          onClick={() => setSelectedProduct(p)} 
                          title="View QR Code"
                          className="p-1 hover:bg-slate-100 rounded-lg inline-block transition"
                        >
                          <img src={p.qrCodeData} alt="QR" className="w-8 h-8 rounded border border-slate-200" />
                        </button>
                      ) : (
                        <span className="text-xs font-mono text-slate-400">{p.barcode}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {products.length === 0 && !loading && (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-400">
                    No products found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ProductModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onCreated={fetchProducts} 
      />

      {selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
            <h3 className="font-bold text-slate-800">{selectedProduct.name}</h3>
            <p className="text-xs font-mono text-slate-500 mb-4">{selectedProduct.sku}</p>
            <img src={selectedProduct.qrCodeData} alt="QR Code" className="w-48 h-48 mx-auto border rounded-xl p-2" />
            <p className="text-xs text-slate-400 mt-3">Barcode: {selectedProduct.barcode}</p>
            <button 
              onClick={() => setSelectedProduct(null)} 
              className="mt-5 w-full bg-slate-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-800"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
