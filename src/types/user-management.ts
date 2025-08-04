// User Management Types
export interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  status: UserStatus;
  phoneNumber?: string;
  department?: string;
  position?: string;
  avatar?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  fullName: string;
}

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  STAFF = 'staff'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended'
}

export interface Permission {
  // Inventory permissions
  INVENTORY_READ: 'inventory:read';
  INVENTORY_WRITE: 'inventory:write';
  INVENTORY_DELETE: 'inventory:delete';
  PRODUCT_CREATE: 'product:create';
  PRODUCT_UPDATE: 'product:update';
  PRODUCT_DELETE: 'product:delete';
  
  // Transaction permissions
  TRANSACTION_READ: 'transaction:read';
  TRANSACTION_CREATE: 'transaction:create';
  TRANSACTION_UPDATE: 'transaction:update';
  TRANSACTION_DELETE: 'transaction:delete';
  
  // Supplier permissions
  SUPPLIER_READ: 'supplier:read';
  SUPPLIER_CREATE: 'supplier:create';
  SUPPLIER_UPDATE: 'supplier:update';
  SUPPLIER_DELETE: 'supplier:delete';
  
  // Purchase order permissions
  PURCHASE_ORDER_READ: 'purchase_order:read';
  PURCHASE_ORDER_CREATE: 'purchase_order:create';
  PURCHASE_ORDER_UPDATE: 'purchase_order:update';
  PURCHASE_ORDER_DELETE: 'purchase_order:delete';
  PURCHASE_ORDER_APPROVE: 'purchase_order:approve';
  
  // Reports permissions
  REPORTS_READ: 'reports:read';
  REPORTS_EXPORT: 'reports:export';
  REPORTS_ADVANCED: 'reports:advanced';
  
  // User management permissions
  USER_READ: 'user:read';
  USER_CREATE: 'user:create';
  USER_UPDATE: 'user:update';
  USER_DELETE: 'user:delete';
  USER_PERMISSIONS: 'user:permissions';
  
  // System permissions
  SYSTEM_SETTINGS: 'system:settings';
  SYSTEM_BACKUP: 'system:backup';
  SYSTEM_LOGS: 'system:logs';
  
  // Notification permissions
  NOTIFICATION_SEND: 'notification:send';
  NOTIFICATION_MANAGE: 'notification:manage';
  
  // Location permissions
  LOCATION_READ: 'location:read';
  LOCATION_CREATE: 'location:create';
  LOCATION_UPDATE: 'location:update';
  LOCATION_DELETE: 'location:delete';
}

export interface ActivityLog {
  id: number;
  userId: number;
  activityType: string;
  description: string;
  entityType?: string;
  entityId?: number;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user: {
    id: number;
    username: string;
    fullName: string;
  };
}

export interface UserPreference {
  id: number;
  userId: number;
  preferenceType: string;
  value: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  phoneNumber?: string;
  department?: string;
  position?: string;
}

export interface UpdateUserInput {
  id: number;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  status?: UserStatus;
  phoneNumber?: string;
  department?: string;
  position?: string;
  avatar?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}
