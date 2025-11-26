import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { saveToken } from '../utils/authStore';
import { useError } from '../components/ErrorProvider';
import { getErrorMessage, ErrorCode } from '../utils/errorCodes';
import { logError } from '../utils/frontendLogger';
import './Login.css';

export default function Login() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const { showError } = useError();

  useEffect(() => {
    const handler = async (e: MessageEvent) => {
      if (e.data && e.data.token) {
        await saveToken(e.data.token);
        window.location.assign('/dashboard');
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const mutation = isRegister ? 'register' : 'login';
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      
      const res = await fetch(`${backendUrl}/graphql`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          query: `mutation ${mutation.charAt(0).toUpperCase() + mutation.slice(1)}($data: ${mutation.charAt(0).toUpperCase() + mutation.slice(1)}Input!) { ${mutation}(data: $data) }`,
          variables: { data: { username, password } },
        }),
      });
      
      const json = await res.json();
      
      if (json.errors) {
        const code = json.errors[0].extensions?.code || ErrorCode.UNKNOWN;
        showError(getErrorMessage(code));
        setError(json.errors[0].message);
        return;
      }

      const token = json.data?.[mutation];
      if (token) {
        await saveToken(token);
        window.location.assign('/dashboard');
      } else {
        showError(getErrorMessage(ErrorCode.AUTH_INVALID));
        setError('Authentication failed');
      }
    } catch (err: any) {
      logError(err instanceof Error ? err : new Error('Network error during login'), { context: 'login', username });
      const code = err?.code || ErrorCode.NETWORK;
      showError(getErrorMessage(code));
      setError(`Network error: ${err instanceof Error ? err.message : 'Please try again.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const openOAuth = (provider: 'google' | 'github') => {
    const w = 500;
    const h = 600;
    const y = window.top ? (window.outerHeight - h) / 2 : 0;
    const x = window.top ? (window.outerWidth - w) / 2 : 0;
    window.open(
      `${import.meta.env.VITE_BACKEND_URL}/auth/${provider}`,
      'oauth',
      `width=${w},height=${h},left=${x},top=${y}`
    );
  };

  if (!loading && user) {
    // Already logged in; redirect away from login
    const redirectTo = (location.state as any)?.from || '/dashboard';
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">OptiPlatform</h1>
          <p className="login-subtitle">Inventory Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-input-group">
            <label className="login-label">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="login-input"
              placeholder="Enter your username"
              disabled={isLoading}
            />
          </div>

          <div className="login-input-group">
            <label className="login-label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
              placeholder="Enter your password"
              disabled={isLoading}
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button 
            type="submit" 
            className={`login-button ${isLoading ? 'disabled' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Please wait...' : (isRegister ? 'Create Account' : 'Sign In')}
          </button>

          <div className="login-toggle-container">
            <span className="login-toggle-text">
              {isRegister ? 'Already have an account?' : "Don't have an account?"}
            </span>
            <button
              type="button"
              onClick={() => {
                if (isRegister) {
                  setIsRegister(false);
                  setError('');
                } else {
                  window.location.href = '/register';
                }
              }}
              className="login-toggle-button"
              disabled={isLoading}
            >
              {isRegister ? 'Sign In' : 'Create Business Account'}
            </button>
          </div>
        </form>

        <div className="login-divider">
          <span className="login-divider-text">Or continue with</span>
        </div>

        <div className="login-oauth-buttons">
          <button 
            onClick={() => openOAuth('google')} 
            className="login-oauth-button google"
            disabled={isLoading}
          >
            <span className="login-oauth-icon">🚀</span>
            Google
          </button>
          <button 
            onClick={() => openOAuth('github')} 
            className="login-oauth-button github"
            disabled={isLoading}
          >
            <span className="login-oauth-icon">⚡</span>
            GitHub
          </button>
        </div>

        {import.meta.env.MODE !== 'production' && (
          <div className="login-demo-credentials">
            <p className="login-demo-title">Demo Credentials:</p>
            <p className="login-demo-text">Username: <strong>mvpuser2025</strong></p>
            <p className="login-demo-text">Password: <strong>mvppass123</strong></p>
          </div>
        )}
      </div>
    </div>
  );
}
