import { Route, Routes, Navigate } from 'react-router-dom';
import MainLayout from './layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';

function App() {
  console.log('App component rendering...');
  
  return (
    <div style={{ minHeight: '100vh', background: '#f0f0f0' }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/reports" element={<Reports />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
