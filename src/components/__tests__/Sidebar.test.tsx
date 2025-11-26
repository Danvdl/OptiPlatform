import { describe, test, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import Sidebar from '../Sidebar';
import { AuthProvider } from '../../contexts/AuthContext';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../utils/userManagementApi', () => ({
  fetchCurrentUser: vi.fn(async () => ({ id: 1, username: 'Admin', role: 'ADMIN' })),
  fetchUserPermissions: vi.fn(async () => ['USER_READ']),
}));

vi.mock('../../utils/authStore', () => ({
  getToken: vi.fn(async () => 'token'),
}));

describe('Sidebar', () => {
  test('admin sees User Management link', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Sidebar />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText('User Management')).toBeInTheDocument();
  });
});
