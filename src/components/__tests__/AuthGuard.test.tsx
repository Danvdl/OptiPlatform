import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import React from 'react';
import { RequireAuth } from '../AuthGuard';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock API clients
vi.mock('../../utils/userManagementApi', () => ({
  fetchCurrentUser: vi.fn(async () => null),
  fetchUserPermissions: vi.fn(async () => []),
}));

vi.mock('../../utils/authStore', () => ({
  getToken: vi.fn(async () => null),
}));

describe('AuthGuard (RequireAuth)', () => {
  test('redirects to login when user is not authenticated', async () => {
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <AuthProvider>
          <Routes>
            <Route
              path="/protected"
              element={
                <RequireAuth>
                  <div>Protected Content</div>
                </RequireAuth>
              }
            />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    // Should redirect to login page when not authenticated
    expect(await screen.findByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  test('shows protected content when user is authenticated', async () => {
    const { fetchCurrentUser } = await import('../../utils/userManagementApi');
    (fetchCurrentUser as any).mockResolvedValueOnce({
      id: 1,
      username: 'testuser',
      role: 'ADMIN',
    });
    
    const { getToken } = await import('../../utils/authStore');
    (getToken as any).mockResolvedValueOnce('valid-token');

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <AuthProvider>
          <Routes>
            <Route
              path="/protected"
              element={
                <RequireAuth>
                  <div>Protected Content</div>
                </RequireAuth>
              }
            />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    // Should show protected content when authenticated
    expect(await screen.findByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });
});
