import React, { useState, useEffect } from 'react';
import { fetchCurrentUser, hasPermission, fetchUserPermissions } from '../utils/userManagementApi';
import { getToken } from '../utils/authStore';
import { User, UserRole } from '../types/user-management';

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
      if (!token) {
        setUser(null);
        setPermissions([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const currentUser = await fetchCurrentUser();
      setUser(currentUser);
      
      // Load user permissions
      const userPermissions = await fetchUserPermissions();
      setPermissions(userPermissions);
    } catch (error) {
      console.error('Error loading user:', error);
      setUser(null);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  const checkPermission = (permission: string): boolean => {
    return permissions.includes(permission);
  };

  useEffect(() => {
    loadUser();
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    permissions,
    hasPermission: checkPermission,
    isAdmin: user?.role === UserRole.ADMIN,
    isManager: user?.role === UserRole.MANAGER,
    isStaff: user?.role === UserRole.STAFF,
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
