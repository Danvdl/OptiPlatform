import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { registerFCM } from './utils/firebaseClient';
import { getToken } from './utils/authStore';
import { ErrorProvider } from './components/ErrorProvider';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <ErrorProvider>
        <App />
      </ErrorProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// Initialize Firebase messaging for notifications
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
