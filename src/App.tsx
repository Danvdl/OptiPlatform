import { Route, Routes, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import MainLayout from './layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Settings from './pages/Settings';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';
import Analytics from './pages/Analytics';
import Suppliers from './pages/Suppliers';
import PurchaseOrders from './pages/PurchaseOrders';
import Pricing from './pages/Pricing';
import Transactions from './pages/Transactions';
import UserManagement from './pages/UserManagement';
import { AuthProvider } from './contexts/AuthContext';
import RequireAuth from './components/AuthGuard';
import OfflineIndicator from './components/OfflineIndicator';
import { startSync } from './db/sync.service';
import { useAutoSync } from './hooks/useOfflineStatus';

function AppContent() {
  // Auto-sync when coming back online
  useAutoSync();

  useEffect(() => {
    // Start periodic sync (every 30 seconds)
    startSync(30000);
    
    console.log('[App] Sync service started');

    return () => {
      // Stop sync when unmounting
      import('./db/sync.service').then(({ stopSync }) => stopSync());
    };
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#f0f0f0' }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<RequireAuth><MainLayout /></RequireAuth>}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/purchase-orders" element={<PurchaseOrders />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>

      {/* Offline/Sync Status Indicator */}
      <OfflineIndicator />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
