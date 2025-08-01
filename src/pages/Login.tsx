import { useEffect, useState } from 'react';
import { saveToken } from '../utils/authStore';
import { useError } from '../components/ErrorProvider';
import { getErrorMessage, ErrorCode } from '../utils/errorCodes';

export default function Login() {
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
      
      console.log('Making request to:', `${backendUrl}/graphql`);
      console.log('Mutation:', mutation);
      console.log('Data:', { username, password });
      
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
      
      console.log('Response status:', res.status);
      console.log('Response headers:', res.headers);
      
      const json = await res.json();
      console.log('Response data:', json);
      
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
      console.error('Network error details:', err);
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

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>OptiPlatform</h1>
          <p style={styles.subtitle}>Inventory Management System</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
              placeholder="Enter your username"
              disabled={isLoading}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="Enter your password"
              disabled={isLoading}
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button 
            type="submit" 
            style={{...styles.button, ...(isLoading ? styles.buttonDisabled : {})}}
            disabled={isLoading}
          >
            {isLoading ? 'Please wait...' : (isRegister ? 'Create Account' : 'Sign In')}
          </button>

          <div style={styles.toggleContainer}>
            <span style={styles.toggleText}>
              {isRegister ? 'Already have an account?' : "Don't have an account?"}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
              style={styles.toggleButton}
              disabled={isLoading}
            >
              {isRegister ? 'Sign In' : 'Create Account'}
            </button>
          </div>
        </form>

        <div style={styles.divider}>
          <span style={styles.dividerText}>Or continue with</span>
        </div>

        <div style={styles.oauthButtons}>
          <button 
            onClick={() => openOAuth('google')} 
            style={{...styles.oauthButton, ...styles.googleButton}}
            disabled={isLoading}
          >
            <span style={styles.oauthIcon}>🚀</span>
            Google
          </button>
          <button 
            onClick={() => openOAuth('github')} 
            style={{...styles.oauthButton, ...styles.githubButton}}
            disabled={isLoading}
          >
            <span style={styles.oauthIcon}>⚡</span>
            GitHub
          </button>
        </div>

        <div style={styles.demoCredentials}>
          <p style={styles.demoTitle}>Demo Credentials:</p>
          <p style={styles.demoText}>Username: <strong>mvpuser2025</strong></p>
          <p style={styles.demoText}>Password: <strong>mvppass123</strong></p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '40px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '32px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '16px',
    color: '#6b7280',
    margin: '0',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
  },
  input: {
    padding: '12px 16px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '16px',
    transition: 'border-color 0.2s',
    outline: 'none',
  },
  button: {
    backgroundColor: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    marginTop: '8px',
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
    cursor: 'not-allowed',
  },
  error: {
    color: '#dc2626',
    fontSize: '14px',
    padding: '8px 12px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '6px',
  },
  toggleContainer: {
    textAlign: 'center' as const,
    marginTop: '8px',
  },
  toggleText: {
    fontSize: '14px',
    color: '#6b7280',
    marginRight: '8px',
  },
  toggleButton: {
    background: 'none',
    border: 'none',
    color: '#4f46e5',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  divider: {
    position: 'relative' as const,
    margin: '32px 0',
    textAlign: 'center' as const,
  },
  dividerText: {
    backgroundColor: 'white',
    color: '#6b7280',
    fontSize: '14px',
    padding: '0 16px',
  },
  oauthButtons: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
  },
  oauthButton: {
    flex: 1,
    padding: '12px 16px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    backgroundColor: 'white',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s',
  },
  googleButton: {
    ':hover': {
      borderColor: '#db4437',
      color: '#db4437',
    },
  },
  githubButton: {
    ':hover': {
      borderColor: '#333',
      color: '#333',
    },
  },
  oauthIcon: {
    fontSize: '16px',
  },
  demoCredentials: {
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
    padding: '16px',
    marginTop: '8px',
  },
  demoTitle: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    margin: '0 0 8px 0',
  },
  demoText: {
    fontSize: '13px',
    color: '#6b7280',
    margin: '2px 0',
  },
};
