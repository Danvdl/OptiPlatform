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
import { logError } from './frontendLogger';

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
    logError(error instanceof Error ? error : new Error('Error fetching users'), { context: 'fetchUsers' });
  return [];
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
    logError(error instanceof Error ? error : new Error('Error fetching current user'), { context: 'fetchCurrentUser' });
  throw error;
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
    logError(error instanceof Error ? error : new Error('Error creating user'), { context: 'createUser', input });
  throw error;
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
    logError(error instanceof Error ? error : new Error('Error updating user'), { context: 'updateUser', userId: input.id });
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
    logError(error instanceof Error ? error : new Error('Error changing password'), { context: 'changePassword' });
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
    logError(error instanceof Error ? error : new Error('Error deleting user'), { context: 'deleteUser', userId: id });
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
    logError(error instanceof Error ? error : new Error('Error fetching user permissions'), { context: 'fetchUserPermissions' });
    return [];
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
    logError(error instanceof Error ? error : new Error('Error granting permission'), { context: 'grantPermission', userId, permission });
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
    logError(error instanceof Error ? error : new Error('Error revoking permission'), { context: 'revokePermission', userId, permission });
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
    logError(error instanceof Error ? error : new Error('Error fetching activity logs'), { context: 'fetchActivityLogs', filter });
  // Return empty array instead of demo data
  return [];
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
    logError(error instanceof Error ? error : new Error('Error fetching user preferences'), { context: 'fetchUserPreferences' });
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
    logError(error instanceof Error ? error : new Error('Error setting user preference'), { context: 'setUserPreference', preferenceType, value });
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
    logError(error instanceof Error ? error : new Error('Error checking permission'), { context: 'hasPermission', permission });
    return false;
  }
}
