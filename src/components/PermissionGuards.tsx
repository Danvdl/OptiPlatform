import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface PermissionGuardProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({ 
  permission, 
  children, 
  fallback = null 
}) => {
  const { hasPermission } = useAuth();

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

interface RoleGuardProps {
  roles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ 
  roles, 
  children, 
  fallback = null 
}) => {
  const { user } = useAuth();

  if (!user || !roles.includes(user.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// Combined guard for both role and permission checks
interface AccessGuardProps {
  roles?: string[];
  permissions?: string[];
  requireAll?: boolean; // If true, user must have ALL permissions, if false, just one
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AccessGuard: React.FC<AccessGuardProps> = ({ 
  roles = [], 
  permissions = [], 
  requireAll = false,
  children, 
  fallback = null 
}) => {
  const { user, hasPermission } = useAuth();

  // Check role access
  const hasRoleAccess = roles.length === 0 || (user && roles.includes(user.role));

  // Check permission access
  let hasPermissionAccess = true;
  if (permissions.length > 0) {
    if (requireAll) {
      hasPermissionAccess = permissions.every(permission => hasPermission(permission));
    } else {
      hasPermissionAccess = permissions.some(permission => hasPermission(permission));
    }
  }

  if (!hasRoleAccess || !hasPermissionAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
