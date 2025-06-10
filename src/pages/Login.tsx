import { useEffect } from 'react';
import { saveToken } from '../utils/authStore';

export default function Login() {
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

  const openOAuth = (provider: 'google' | 'github') => {
    const w = 500;
    const h = 600;
    const y = window.top ? (window.outerHeight - h) / 2 : 0;
    const x = window.top ? (window.outerWidth - w) / 2 : 0;
    window.open(
      `http://localhost:3001/auth/${provider}`,
      'oauth',
      `width=${w},height=${h},left=${x},top=${y}`
    );
  };

  return (
    <div>
      <h1>Login</h1>
      <button onClick={() => openOAuth('google')}>Login with Google</button>
      <button onClick={() => openOAuth('github')}>Login with GitHub</button>
    </div>
  );
}
