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
      console.log('🔑 Auth Debug - Token found:', !!token);
      
      if (!token) {
        console.log('❌ Auth Debug - No token found, setting user to null');
        setUser(null);
        setPermissions([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      console.log('📡 Auth Debug - Fetching current user...');
      
      const currentUser = await fetchCurrentUser();
      console.log('👤 Auth Debug - Current user:', currentUser);
      console.log('🎭 Auth Debug - User role:', currentUser?.role, typeof currentUser?.role);
      
      setUser(currentUser);
      
      // Load user permissions
      console.log('🔐 Auth Debug - Fetching user permissions...');
      
      const userPermissions = await fetchUserPermissions();
      console.log('🔐 Auth Debug - User permissions:', userPermissions);
      
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
    isAdmin: user?.role?.toLowerCase() === UserRole.ADMIN.toLowerCase(),
    isManager: user?.role?.toLowerCase() === UserRole.MANAGER.toLowerCase(),
    isStaff: user?.role?.toLowerCase() === UserRole.STAFF.toLowerCase(),
    refreshUser: loadUser
  };

  // Debug logging
  console.log('🎭 Auth Context Values:', {
    user: user ? { id: user.id, username: user.username, role: user.role } : null,
    loading,
    isAdmin: user?.role === UserRole.ADMIN,
    userRole: user?.role,
    UserRoleADMIN: UserRole.ADMIN,
    roleComparison: user?.role === UserRole.ADMIN
  });

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
