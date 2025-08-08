import { describe, test, expect, jest } from '@jest/globals';
import '@testing-library/jest-dom';
import { toBeInTheDocument } from '@testing-library/jest-dom/matchers';
expect.extend({ toBeInTheDocument });
import React from 'react';
import { render, screen } from '@testing-library/react';
import Sidebar from '../Sidebar';
import { AuthProvider } from '../../contexts/AuthContext';
import { MemoryRouter } from 'react-router-dom';
import matchers from '@testing-library/jest-dom/matchers';
import '@testing-library/jest-dom';
import '@testing-library/jest-dom/jest-globals';
jest.mock('../../utils/userManagementApi', () => ({
  fetchCurrentUser: jest.fn(async () => ({ id: 1, username: 'Admin', role: 'ADMIN' })),
  fetchUserPermissions: jest.fn(async () => ['USER_READ']),
}));

jest.mock('../../utils/authStore', () => ({
  getToken: jest.fn(async () => 'token'),
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
