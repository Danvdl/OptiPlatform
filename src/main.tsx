import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { sync } from './utils/inventoryDB';
import { registerFCM } from './utils/firebaseClient';
import { getToken } from './utils/authStore';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

sync();
registerFCM(async (token) => {
  const jwt = await getToken();
  await fetch(`${import.meta.env.VITE_BACKEND_URL}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
    },
    body: JSON.stringify({
      query: 'mutation Register($token: String!) { registerDeviceToken(token: $token) }',
      variables: { token },
    }),
  });
});
