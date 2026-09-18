import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import BarcodeModal from './components/BarcodeModal';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Warehouses from './pages/Warehouses';
import AuditLogs from './pages/AuditLogs';
import PurchaseOrders from './pages/PurchaseOrders';
import PurchaseOrderDetail from './pages/PurchaseOrderDetail';
import PrintReceivingSlip from './pages/PrintReceivingSlip';
import DispatchOrders from './pages/DispatchOrders';
import DispatchOrderDetail from './pages/DispatchOrderDetail';
import PrintDeliveryNote from './pages/PrintDeliveryNote';
import StockTransfers from './pages/StockTransfers';
import StockAdjustments from './pages/StockAdjustments';
import Reports from './pages/Reports';

const ProtectedLayout = () => {
  const { user, loading } = useAuth();
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  if (loading) {
    return <div className="h-screen flex items-center justify-center bg-slate-950 text-white font-bold tracking-wide">Loading WMS Ops Console...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar onScanClick={() => setIsScannerOpen(true)} />
      <div className="pl-64 flex flex-col min-h-screen">
        <Navbar />
        <main className="p-8 flex-1">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/warehouses" element={<Warehouses />} />
            <Route path="/purchase-orders" element={<PurchaseOrders />} />
            <Route path="/purchase-orders/:id" element={<PurchaseOrderDetail />} />
            <Route path="/dispatch-orders" element={<DispatchOrders />} />
            <Route path="/dispatch-orders/:id" element={<DispatchOrderDetail />} />
            <Route path="/stock-transfers" element={<StockTransfers />} />
            <Route path="/stock-adjustments" element={<StockAdjustments />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/audit" element={<AuditLogs />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      <BarcodeModal 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/print/po/:id" element={<PrintReceivingSlip />} />
          <Route path="/print/do/:id" element={<PrintDeliveryNote />} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
