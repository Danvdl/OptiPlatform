import { useEffect, useState } from 'react';
import { saveToken } from '../utils/authStore';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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

  const login = async () => {
    const res = await fetch('http://localhost:3001/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'mutation Login($data: LoginInput!) { login(data: $data) }',
        variables: { data: { username, password } },
      }),
    });
    const json = await res.json();
    const token = json.data?.login;
    if (token) {
      await saveToken(token);
      window.location.assign('/dashboard');
    }
  };

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
      <div>
        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={login}>Login</button>
      </div>
      <button onClick={() => openOAuth('google')}>Login with Google</button>
      <button onClick={() => openOAuth('github')}>Login with GitHub</button>
    </div>
  );
}
