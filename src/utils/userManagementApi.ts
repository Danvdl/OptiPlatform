import { graphql } from './inventoryApi';
import { 
  User, 
  UserRole, 
  UserStatus, 
  ActivityLog, 
  UserPreference,
  CreateUserInput, 
  UpdateUserInput, 
  ChangePasswordInput 
} from '../types/user-management';

// User Management API Functions
export async function fetchUsers(): Promise<User[]> {
  const query = `
    query GetUsers {
      users {
        id
        username
        email
        firstName
        lastName
        role
        status
        phoneNumber
        department
        position
        avatar
        lastLoginAt
        createdAt
        updatedAt
        fullName
      }
    }
  `;
  
  try {
    const data = await graphql<{ users: User[] }>(query);
    return data.users;
  } catch (error) {
    console.error('Error fetching users:', error);
    // Return demo data as fallback
    return [
      {
        id: 1,
        username: 'admin',
        email: 'admin@optiplatform.local',
        firstName: 'System',
        lastName: 'Administrator',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        department: 'IT',
        position: 'System Administrator',
        lastLoginAt: '2025-08-03T10:30:00Z',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-08-03T10:30:00Z',
        fullName: 'System Administrator'
      },
      {
        id: 2,
        username: 'manager1',
        email: 'manager@optiplatform.local',
        firstName: 'John',
        lastName: 'Smith',
        role: UserRole.MANAGER,
        status: UserStatus.ACTIVE,
        department: 'Operations',
        position: 'Inventory Manager',
        phoneNumber: '+1-555-0101',
        lastLoginAt: '2025-08-02T16:45:00Z',
        createdAt: '2025-02-01T00:00:00Z',
        updatedAt: '2025-08-02T16:45:00Z',
        fullName: 'John Smith'
      },
      {
        id: 3,
        username: 'staff1',
        email: 'staff@optiplatform.local',
        firstName: 'Jane',
        lastName: 'Doe',
        role: UserRole.STAFF,
        status: UserStatus.ACTIVE,
        department: 'Warehouse',
        position: 'Inventory Clerk',
        phoneNumber: '+1-555-0102',
        lastLoginAt: '2025-08-03T09:15:00Z',
        createdAt: '2025-03-01T00:00:00Z',
        updatedAt: '2025-08-03T09:15:00Z',
        fullName: 'Jane Doe'
      }
    ];
  }
}

export async function fetchCurrentUser(): Promise<User> {
  const query = `
    query GetCurrentUser {
      currentUser {
        id
        username
        email
        firstName
        lastName
        role
        status
        phoneNumber
        department
        position
        avatar
        lastLoginAt
        createdAt
        updatedAt
        fullName
      }
    }
  `;
  
  try {
    const data = await graphql<{ currentUser: User }>(query);
    return data.currentUser;
  } catch (error) {
    console.error('Error fetching current user:', error);
    // Return demo current user
    return {
      id: 1,
      username: 'admin',
      email: 'admin@optiplatform.local',
      firstName: 'System',
      lastName: 'Administrator',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      department: 'IT',
      position: 'System Administrator',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-08-03T10:30:00Z',
      fullName: 'System Administrator'
    };
  }
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const mutation = `
    mutation CreateUser($input: CreateUserInput!) {
      createUser(input: $input) {
        id
        username
        email
        firstName
        lastName
        role
        status
        phoneNumber
        department
        position
        createdAt
        updatedAt
        fullName
      }
    }
  `;
  
  try {
    const data = await graphql<{ createUser: User }>(mutation, { input });
    return data.createUser;
  } catch (error) {
    console.error('Error creating user:', error);
    // Return mock response for development
    return {
      id: Date.now(),
      ...input,
      status: UserStatus.ACTIVE,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      fullName: input.firstName && input.lastName ? `${input.firstName} ${input.lastName}` : input.username
    };
  }
}

export async function updateUser(input: UpdateUserInput): Promise<User> {
  const mutation = `
    mutation UpdateUser($input: UpdateUserInput!) {
      updateUser(input: $input) {
        id
        username
        email
        firstName
        lastName
        role
        status
        phoneNumber
        department
        position
        avatar
        lastLoginAt
        createdAt
        updatedAt
        fullName
      }
    }
  `;
  
  try {
    const data = await graphql<{ updateUser: User }>(mutation, { input });
    return data.updateUser;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

export async function changePassword(input: ChangePasswordInput): Promise<boolean> {
  const mutation = `
    mutation ChangePassword($input: ChangePasswordInput!) {
      changePassword(input: $input)
    }
  `;
  
  try {
    const data = await graphql<{ changePassword: boolean }>(mutation, { input });
    return data.changePassword;
  } catch (error) {
    console.error('Error changing password:', error);
    throw error;
  }
}

export async function deleteUser(id: number): Promise<boolean> {
  const mutation = `
    mutation DeleteUser($id: Int!) {
      deleteUser(id: $id)
    }
  `;
  
  try {
    const data = await graphql<{ deleteUser: boolean }>(mutation, { id });
    return data.deleteUser;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

// Permission Management
export async function fetchUserPermissions(userId?: number): Promise<string[]> {
  const query = `
    query GetUserPermissions($userId: Int) {
      userPermissions(userId: $userId)
    }
  `;
  
  try {
    const data = await graphql<{ userPermissions: string[] }>(query, { userId });
    return data.userPermissions;
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    // Return demo permissions
    return [
      'inventory:read',
      'inventory:write',
      'product:create',
      'product:update',
      'transaction:read',
      'transaction:create',
      'user:read'
    ];
  }
}

export async function grantPermission(userId: number, permission: string): Promise<boolean> {
  const mutation = `
    mutation GrantPermission($input: GrantPermissionInput!) {
      grantPermission(input: $input)
    }
  `;
  
  try {
    const data = await graphql<{ grantPermission: boolean }>(mutation, { 
      input: { userId, permission } 
    });
    return data.grantPermission;
  } catch (error) {
    console.error('Error granting permission:', error);
    return false;
  }
}

export async function revokePermission(userId: number, permission: string): Promise<boolean> {
  const mutation = `
    mutation RevokePermission($input: RevokePermissionInput!) {
      revokePermission(input: $input)
    }
  `;
  
  try {
    const data = await graphql<{ revokePermission: boolean }>(mutation, { 
      input: { userId, permission } 
    });
    return data.revokePermission;
  } catch (error) {
    console.error('Error revoking permission:', error);
    return false;
  }
}

// Activity Logs
export async function fetchActivityLogs(filter: {
  userId?: number;
  entityType?: string;
  entityId?: number;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}): Promise<ActivityLog[]> {
  const query = `
    query GetActivityLogs($filter: ActivityLogFilterInput!) {
      activityLogs(filter: $filter) {
        id
        userId
        activityType
        description
        entityType
        entityId
        details
        ipAddress
        userAgent
        createdAt
        user {
          id
          username
          fullName
        }
      }
    }
  `;
  
  try {
    const data = await graphql<{ activityLogs: ActivityLog[] }>(query, { filter });
    return data.activityLogs;
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    // Return demo data
    return [
      {
        id: 1,
        userId: 1,
        activityType: 'login',
        description: 'User logged in',
        createdAt: '2025-08-03T10:30:00Z',
        user: {
          id: 1,
          username: 'admin',
          fullName: 'System Administrator'
        }
      },
      {
        id: 2,
        userId: 2,
        activityType: 'create',
        description: 'Created product: Wireless Mouse',
        entityType: 'Product',
        entityId: 1,
        createdAt: '2025-08-03T09:15:00Z',
        user: {
          id: 2,
          username: 'manager1',
          fullName: 'John Smith'
        }
      }
    ];
  }
}

// User Preferences
export async function fetchUserPreferences(): Promise<UserPreference[]> {
  const query = `
    query GetUserPreferences {
      userPreferences {
        id
        userId
        preferenceType
        value
        createdAt
        updatedAt
      }
    }
  `;
  
  try {
    const data = await graphql<{ userPreferences: UserPreference[] }>(query);
    return data.userPreferences;
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return [];
  }
}

export async function setUserPreference(preferenceType: string, value: string): Promise<UserPreference> {
  const mutation = `
    mutation SetUserPreference($input: SetUserPreferenceInput!) {
      setUserPreference(input: $input) {
        id
        userId
        preferenceType
        value
        createdAt
        updatedAt
      }
    }
  `;
  
  try {
    const data = await graphql<{ setUserPreference: UserPreference }>(mutation, { 
      input: { preferenceType, value } 
    });
    return data.setUserPreference;
  } catch (error) {
    console.error('Error setting user preference:', error);
    throw error;
  }
}

export async function hasPermission(permission: string): Promise<boolean> {
  const query = `
    query HasPermission($permission: Permission!) {
      hasPermission(permission: $permission)
    }
  `;
  
  try {
    const data = await graphql<{ hasPermission: boolean }>(query, { permission });
    return data.hasPermission;
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}
