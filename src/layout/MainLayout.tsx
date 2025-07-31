import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

export default function MainLayout() {
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
    }}>
      <Sidebar />
      <main style={{
        flex: 1,
        overflow: 'auto'
      }}>
        <Outlet />
      </main>
    </div>
  );
}
