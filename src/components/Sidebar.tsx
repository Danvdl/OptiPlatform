import { NavLink } from 'react-router-dom';
import { clearToken } from '../utils/authStore';

export default function Sidebar() {
  const handleLogout = async () => {
    await clearToken();
    window.location.href = '/login';
  };

  return (
    <nav style={{
      width: '280px',
      background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
      color: 'white',
      padding: '1.5rem',
      boxShadow: '4px 0 10px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh'
    }}>
      {/* Logo */}
      <div style={{
        marginBottom: '2rem',
        textAlign: 'center',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        paddingBottom: '1.5rem'
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '1.75rem',
          fontWeight: '700',
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}>
          📦 OptiPlatform
        </h2>
        <p style={{
          margin: '0.5rem 0 0',
          fontSize: '0.875rem',
          opacity: 0.7
        }}>
          Inventory Management
        </p>
      </div>

      {/* Navigation */}
      <ul style={{
        listStyle: 'none',
        padding: 0,
        margin: 0,
        flex: 1
      }}>
        <li style={{ marginBottom: '0.5rem' }}>
          <NavLink
            to="/dashboard"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.875rem 1rem',
              borderRadius: '0.75rem',
              textDecoration: 'none',
              color: 'white',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              background: isActive 
                ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' 
                : 'transparent',
              transform: isActive ? 'translateX(4px)' : 'none',
              boxShadow: isActive 
                ? '0 4px 12px rgba(59, 130, 246, 0.4)' 
                : 'none'
            })}
            className="sidebar-link"
          >
            <span style={{ fontSize: '1.25rem' }}>📊</span>
            Dashboard
          </NavLink>
        </li>
        <li style={{ marginBottom: '0.5rem' }}>
          <NavLink
            to="/inventory"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.875rem 1rem',
              borderRadius: '0.75rem',
              textDecoration: 'none',
              color: 'white',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              background: isActive 
                ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' 
                : 'transparent',
              transform: isActive ? 'translateX(4px)' : 'none',
              boxShadow: isActive 
                ? '0 4px 12px rgba(59, 130, 246, 0.4)' 
                : 'none'
            })}
            className="sidebar-link"
          >
            <span style={{ fontSize: '1.25rem' }}>📦</span>
            Inventory
          </NavLink>
        </li>
      </ul>

      {/* User section */}
      <div style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        paddingTop: '1.5rem',
        marginTop: 'auto'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '0.75rem',
          padding: '1rem',
          marginBottom: '1rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '0.5rem'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem'
            }}>
              👤
            </div>
            <div>
              <div style={{ fontWeight: '500', fontSize: '0.875rem' }}>
                MVP User
              </div>
              <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                Administrator
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '0.875rem 1rem',
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            color: 'white',
            border: 'none',
            borderRadius: '0.75rem',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
          className="hover-lift"
        >
          <span>🚪</span>
          Logout
        </button>
      </div>

      <style>{`
        .sidebar-link:hover {
          background: rgba(255, 255, 255, 0.1) !important;
          transform: translateX(4px) !important;
        }
      `}</style>
    </nav>
  );
}
