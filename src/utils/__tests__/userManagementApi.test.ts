import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchUsers,
  fetchCurrentUser,
  createUser,
  updateUser,
  changePassword,
  deleteUser,
  fetchUserPermissions,
  grantPermission,
  revokePermission,
  fetchActivityLogs,
  fetchUserPreferences,
  setUserPreference,
  hasPermission,
} from '../userManagementApi';
import { User, ActivityLog, UserPreference } from '../../types/user-management';

// Mock modules
vi.mock('../authStore', () => ({
  getToken: vi.fn().mockResolvedValue('test-token'),
}));

vi.mock('../frontendLogger', () => ({
  logError: vi.fn(),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe('userManagementApi', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchUsers', () => {
    it('fetches all users successfully', async () => {
      const mockUsers: User[] = [
        {
          id: 1,
          username: 'johndoe',
          email: 'john@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'admin',
          status: 'active',
          phoneNumber: '555-1234',
          department: 'IT',
          position: 'Developer',
          avatar: 'avatar.jpg',
          lastLoginAt: new Date('2024-01-01'),
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2024-01-01'),
          fullName: 'John Doe',
        },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: { users: mockUsers } }),
      });

      const result = await fetchUsers();
      expect(result).toEqual(mockUsers);
      
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.query).toContain('query GetUsers');
    });

    it('returns empty array on error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ errors: [{ message: 'Network error' }] }),
      });

      const result = await fetchUsers();
      expect(result).toEqual([]);
    });
  });

  describe('fetchCurrentUser', () => {
    it('fetches the current user successfully', async () => {
      const mockUser: User = {
        id: 1,
        username: 'currentuser',
        email: 'current@example.com',
        firstName: 'Current',
        lastName: 'User',
        role: 'admin',
        status: 'active',
        fullName: 'Current User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: { currentUser: mockUser } }),
      });

      const result = await fetchCurrentUser();
      expect(result).toEqual(mockUser);
      
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.query).toContain('query GetCurrentUser');
    });

    it('throws error when fetching current user fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ errors: [{ message: 'Unauthorized' }] }),
      });

      await expect(fetchCurrentUser()).rejects.toThrow();
    });
  });

  describe('createUser', () => {
    it('creates a new user successfully', async () => {
      const input = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'securepassword',
        firstName: 'New',
        lastName: 'User',
        role: 'staff' as const,
      };

      const mockCreatedUser: User = {
        id: 2,
        ...input,
        status: 'active',
        fullName: 'New User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: { createUser: mockCreatedUser } }),
      });

      const result = await createUser(input);
      expect(result).toEqual(mockCreatedUser);
      
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.query).toContain('mutation CreateUser');
      expect(callBody.variables.input).toMatchObject(input);
    });

    it('throws error when creation fails', async () => {
      const input = {
        username: 'duplicate',
        email: 'dup@example.com',
        password: 'pass',
        role: 'staff' as const,
      };

      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ errors: [{ message: 'Username already exists' }] }),
      });

      await expect(createUser(input)).rejects.toThrow();
    });
  });

  describe('updateUser', () => {
    it('updates a user successfully', async () => {
      const input = {
        id: 1,
        firstName: 'Updated',
        lastName: 'Name',
        department: 'Sales',
      };

      const mockUpdatedUser: User = {
        id: 1,
        username: 'user1',
        email: 'user1@example.com',
        firstName: 'Updated',
        lastName: 'Name',
        role: 'staff',
        status: 'active',
        department: 'Sales',
        fullName: 'Updated Name',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: { updateUser: mockUpdatedUser } }),
      });

      const result = await updateUser(input);
      expect(result).toEqual(mockUpdatedUser);
      
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.query).toContain('mutation UpdateUser');
      expect(callBody.variables.input).toMatchObject(input);
    });

    it('throws error when update fails', async () => {
      const input = { id: 999, firstName: 'NonExistent' };

      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ errors: [{ message: 'User not found' }] }),
      });

      await expect(updateUser(input)).rejects.toThrow();
    });
  });

  describe('changePassword', () => {
    it('changes password successfully', async () => {
      const input = {
        currentPassword: 'oldpass',
        newPassword: 'newpass',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: { changePassword: true } }),
      });

      const result = await changePassword(input);
      expect(result).toBe(true);
      
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.query).toContain('mutation ChangePassword');
      expect(callBody.variables.input).toEqual(input);
    });

    it('throws error when password change fails', async () => {
      const input = {
        currentPassword: 'wrongpass',
        newPassword: 'newpass',
      };

      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ errors: [{ message: 'Current password incorrect' }] }),
      });

      await expect(changePassword(input)).rejects.toThrow();
    });
  });

  describe('deleteUser', () => {
    it('deletes a user successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: { deleteUser: true } }),
      });

      const result = await deleteUser(5);
      expect(result).toBe(true);
      
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.query).toContain('mutation DeleteUser');
      expect(callBody.variables.id).toBe(5);
    });

    it('throws error when deletion fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ errors: [{ message: 'Cannot delete user' }] }),
      });

      await expect(deleteUser(1)).rejects.toThrow();
    });
  });

  describe('fetchUserPermissions', () => {
    it('fetches permissions for a specific user', async () => {
      const mockPermissions = ['user:read', 'user:write', 'inventory:read'];

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: { userPermissions: mockPermissions } }),
      });

      const result = await fetchUserPermissions(10);
      expect(result).toEqual(mockPermissions);
      
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.query).toContain('query GetUserPermissions');
      expect(callBody.variables.userId).toBe(10);
    });

    it('fetches permissions without userId (current user)', async () => {
      const mockPermissions = ['user:read'];

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: { userPermissions: mockPermissions } }),
      });

      const result = await fetchUserPermissions();
      expect(result).toEqual(mockPermissions);
    });

    it('returns empty array on error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ errors: [{ message: 'Error' }] }),
      });

      const result = await fetchUserPermissions(10);
      expect(result).toEqual([]);
    });
  });

  describe('grantPermission', () => {
    it('grants a permission to a user', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: { grantPermission: true } }),
      });

      const result = await grantPermission(5, 'inventory:write');
      expect(result).toBe(true);
      
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.query).toContain('mutation GrantPermission');
      expect(callBody.variables.input).toEqual({ userId: 5, permission: 'inventory:write' });
    });

    it('returns false on error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ errors: [{ message: 'Permission not found' }] }),
      });

      const result = await grantPermission(5, 'invalid:perm');
      expect(result).toBe(false);
    });
  });

  describe('revokePermission', () => {
    it('revokes a permission from a user', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: { revokePermission: true } }),
      });

      const result = await revokePermission(5, 'inventory:write');
      expect(result).toBe(true);
      
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.query).toContain('mutation RevokePermission');
      expect(callBody.variables.input).toEqual({ userId: 5, permission: 'inventory:write' });
    });

    it('returns false on error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ errors: [{ message: 'Permission not found' }] }),
      });

      const result = await revokePermission(5, 'invalid:perm');
      expect(result).toBe(false);
    });
  });

  describe('fetchActivityLogs', () => {
    it('fetches activity logs with filter', async () => {
      const mockLogs: ActivityLog[] = [
        {
          id: 1,
          userId: 5,
          activityType: 'LOGIN',
          description: 'User logged in',
          entityType: 'user',
          entityId: 5,
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          createdAt: new Date('2024-01-01'),
          user: {
            id: 5,
            username: 'testuser',
            fullName: 'Test User',
          },
        },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: { activityLogs: mockLogs } }),
      });

      const filter = { userId: 5, limit: 10 };
      const result = await fetchActivityLogs(filter);
      expect(result).toEqual(mockLogs);
      
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.query).toContain('query GetActivityLogs');
      expect(callBody.variables.filter).toMatchObject(filter);
    });

    it('returns empty array on error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ errors: [{ message: 'Error' }] }),
      });

      const result = await fetchActivityLogs({ userId: 5 });
      expect(result).toEqual([]);
    });
  });

  describe('fetchUserPreferences', () => {
    it('fetches user preferences successfully', async () => {
      const mockPreferences: UserPreference[] = [
        {
          id: 1,
          userId: 10,
          preferenceType: 'theme',
          value: 'dark',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        {
          id: 2,
          userId: 10,
          preferenceType: 'language',
          value: 'en',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: { userPreferences: mockPreferences } }),
      });

      const result = await fetchUserPreferences();
      expect(result).toEqual(mockPreferences);
      
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.query).toContain('query GetUserPreferences');
    });

    it('returns empty array on error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ errors: [{ message: 'Error' }] }),
      });

      const result = await fetchUserPreferences();
      expect(result).toEqual([]);
    });
  });

  describe('setUserPreference', () => {
    it('sets a user preference successfully', async () => {
      const mockPreference: UserPreference = {
        id: 3,
        userId: 10,
        preferenceType: 'notifications',
        value: 'enabled',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: { setUserPreference: mockPreference } }),
      });

      const result = await setUserPreference('notifications', 'enabled');
      expect(result).toEqual(mockPreference);
      
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.query).toContain('mutation SetUserPreference');
      expect(callBody.variables.input).toEqual({ preferenceType: 'notifications', value: 'enabled' });
    });

    it('throws error when setting preference fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ errors: [{ message: 'Invalid preference' }] }),
      });

      await expect(setUserPreference('invalid', 'value')).rejects.toThrow();
    });
  });

  describe('hasPermission', () => {
    it('checks if user has a specific permission (true)', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: { hasPermission: true } }),
      });

      const result = await hasPermission('user:read');
      expect(result).toBe(true);
      
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.query).toContain('query HasPermission');
      expect(callBody.variables.permission).toBe('user:read');
    });

    it('checks if user has a specific permission (false)', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: { hasPermission: false } }),
      });

      const result = await hasPermission('admin:delete');
      expect(result).toBe(false);
    });

    it('returns false on error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ errors: [{ message: 'Error checking permission' }] }),
      });

      const result = await hasPermission('user:read');
      expect(result).toBe(false);
    });
  });
});
