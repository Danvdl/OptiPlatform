import React, { useState, useEffect } from 'react';
import { fetchCurrentUser, hasPermission, fetchUserPermissions } from '../utils/userManagementApi';
import { getToken } from '../utils/authStore';
import { User, UserRole } from '../types/user-management';
import { logInfo, logError } from '../utils/frontendLogger';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  permissions: string[];
  hasPermission: (permission: string) => boolean;
  isAdmin: boolean;
  isManager: boolean;
  isStaff: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType>({
  user: null,
  loading: true,
  permissions: [],
  hasPermission: () => false,
  isAdmin: false,
  isManager: false,
  isStaff: false,
  refreshUser: async () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<string[]>([]);

  const loadUser = async () => {
    try {
      // Check if there's a token before making API calls
      const token = await getToken();
      logInfo('Auth: Token check', { hasToken: !!token });
      
      if (!token) {
        logInfo('Auth: No token found, setting user to null');
        setUser(null);
        setPermissions([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      logInfo('Auth: Fetching current user');
      
      const currentUser = await fetchCurrentUser();
      logInfo('Auth: User loaded', { 
        userId: currentUser?.id, 
        username: currentUser?.username, 
        role: currentUser?.role 
      });
      
      setUser(currentUser);
      
      // Load user permissions
      logInfo('Auth: Fetching user permissions');
      
      const rawPermissions = await fetchUserPermissions();
      // Normalize GraphQL enum names (e.g., USER_READ) to code format (e.g., user:read)
      const normalizedPermissions = (rawPermissions || []).map(p =>
        typeof p === 'string' && p.includes(':') ? p : String(p || '')
          .toLowerCase()
          .replace(/_/g, ':')
      );
      logInfo('Auth: Permissions loaded', { 
        count: normalizedPermissions.length,
        permissions: normalizedPermissions 
      });
      
      setPermissions(normalizedPermissions);
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), { 
        context: 'Auth: Failed to load user' 
      });
      setUser(null);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  const checkPermission = (permission: string): boolean => {
    const normalized = permission && (permission.includes(':')
      ? permission
      : permission.toLowerCase().replace(/_/g, ':'));
    const has = permissions.includes(normalized);
    logInfo('Auth: Permission check', { 
      permission: normalized, 
      granted: has 
    });
    return has;
  };

  useEffect(() => {
    loadUser();
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    permissions,
    hasPermission: checkPermission,
    isAdmin: user?.role?.toLowerCase() === UserRole.ADMIN.toLowerCase(),
    isManager: user?.role?.toLowerCase() === UserRole.MANAGER.toLowerCase(),
    isStaff: user?.role?.toLowerCase() === UserRole.STAFF.toLowerCase(),
    refreshUser: loadUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
