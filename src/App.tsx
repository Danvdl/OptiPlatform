import { Route, Routes, Navigate } from 'react-router-dom';
import MainLayout from './layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';
import Suppliers from './pages/Suppliers';
import PurchaseOrders from './pages/PurchaseOrders';
import Pricing from './pages/Pricing';
import Transactions from './pages/Transactions';
import UserManagement from './pages/UserManagement';
import { AuthProvider } from './contexts/AuthContext';
import RequireAuth from './components/AuthGuard';

function App() {
  return (
    <AuthProvider>
      <div style={{ minHeight: '100vh', background: '#f0f0f0' }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<RequireAuth><MainLayout /></RequireAuth>}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/purchase-orders" element={<PurchaseOrders />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/users" element={<UserManagement />} />
          </Route>
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;
