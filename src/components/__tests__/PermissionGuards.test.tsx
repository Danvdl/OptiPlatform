import { describe, test, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { PermissionGuard, RoleGuard, AccessGuard } from '../PermissionGuards';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock API clients used by AuthContext
vi.mock('../../utils/userManagementApi', () => ({
  fetchCurrentUser: vi.fn(async () => ({ id: '1', username: 'admin', role: 'ADMIN' })),
  fetchUserPermissions: vi.fn(async () => ['USER_READ', 'INVENTORY_READ']),
}));
vi.mock('../../utils/authStore', () => ({
  getToken: vi.fn(async () => 'token'),
}));

function withAuth(children: React.ReactNode) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('PermissionGuards', () => {
  test('PermissionGuard allows admin regardless of permission', async () => {
    render(withAuth(
      <PermissionGuard permission="user:delete">
        <div data-testid="content">secret</div>
      </PermissionGuard>
    ));
    expect(await screen.findByTestId('content')).toBeInTheDocument();
  });

  test('RoleGuard matches roles case-insensitively', async () => {
    render(withAuth(
      <RoleGuard roles={["admin"]}>
        <div data-testid="role-ok">ok</div>
      </RoleGuard>
    ));
    expect(await screen.findByTestId('role-ok')).toBeInTheDocument();
  });

  test('AccessGuard passes with permissions when no role restriction (admin bypass for permissions)', async () => {
    render(withAuth(
      <AccessGuard permissions={["user:read"]} requireAll={false}>
        <div data-testid="visible">visible</div>
      </AccessGuard>
    ));
    expect(await screen.findByTestId('visible')).toBeInTheDocument();
  });

  test('AccessGuard blocks if required role not met even if user is admin (no role bypass implemented)', async () => {
    render(withAuth(
      <AccessGuard roles={["manager"]} permissions={["user:read"]}>
        <div data-testid="blocked">should-not-see</div>
      </AccessGuard>
    ));
    expect(screen.queryByTestId('blocked')).toBeNull();
  });
});
