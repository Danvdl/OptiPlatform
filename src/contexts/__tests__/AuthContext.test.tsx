import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import { AuthProvider, useAuth } from '../AuthContext';

vi.mock('../../utils/userManagementApi', () => ({
  fetchCurrentUser: vi.fn(async () => ({ id: 42, username: 'Casey', role: 'MANAGER' })),
  fetchUserPermissions: vi.fn(async () => ['USER_READ', 'INVENTORY_WRITE']),
}));
vi.mock('../../utils/authStore', () => ({
  getToken: vi.fn(async () => 'token'),
}));

function ShowAuth() {
  const { user, permissions, isAdmin, isManager, isStaff, hasPermission } = useAuth();
  return (
    <div>
      <div data-testid="role">{user?.role}</div>
      <div data-testid="admin">{String(isAdmin)}</div>
      <div data-testid="manager">{String(isManager)}</div>
      <div data-testid="staff">{String(isStaff)}</div>
      <div data-testid="perm-user-read">{String(hasPermission('user:read'))}</div>
      <div data-testid="perm-inventory-write">{String(hasPermission('inventory:write'))}</div>
      <div data-testid="perms">{permissions.join(',')}</div>
    </div>
  );
}

describe('AuthContext', () => {
  test('normalizes role casing and permissions from enums', async () => {
    render(
      <AuthProvider>
        <ShowAuth />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('role').textContent).toBe('MANAGER'));
    expect(screen.getByTestId('admin').textContent).toBe('false');
    expect(screen.getByTestId('manager').textContent).toBe('true');
    expect(screen.getByTestId('staff').textContent).toBe('false');
    expect(screen.getByTestId('perm-user-read').textContent).toBe('true');
    expect(screen.getByTestId('perm-inventory-write').textContent).toBe('true');
    expect(screen.getByTestId('perms').textContent).toBe('user:read,inventory:write');
  });
});
