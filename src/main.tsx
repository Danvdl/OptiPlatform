import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { sync } from './utils/inventoryDB';
import { registerFCM } from './utils/firebaseClient';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

sync();
registerFCM(async (token) => {
  await fetch('http://localhost:3001/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'mutation Register($token: String!) { registerDeviceToken(token: $token) }',
      variables: { token },
    }),
  });
});
