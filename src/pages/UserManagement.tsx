import React, { useState, useEffect } from 'react';
import './UserManagement.css';
import { 
  fetchUsers, 
  createUser, 
  updateUser, 
  deleteUser,
  fetchUserPermissions,
  grantPermission,
  revokePermission
} from '../utils/userManagementApi';
import { User, UserRole, UserStatus, CreateUserInput, UpdateUserInput } from '../types/user-management';
import { PermissionGuard } from '../components/PermissionGuards';

const AVAILABLE_PERMISSIONS = [
  'inventory:read', 'inventory:write', 'inventory:delete',
  'product:create', 'product:update', 'product:delete',
  'transaction:read', 'transaction:create', 'transaction:update', 'transaction:delete',
  'supplier:read', 'supplier:create', 'supplier:update', 'supplier:delete',
  'purchase_order:read', 'purchase_order:create', 'purchase_order:update', 
  'purchase_order:delete', 'purchase_order:approve',
  'reports:read', 'reports:export', 'reports:advanced',
  'user:read', 'user:create', 'user:update', 'user:delete', 'user:permissions',
  'system:settings', 'system:backup', 'system:logs',
  'notification:send', 'notification:manage',
  'location:read', 'location:create', 'location:update', 'location:delete'
];

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  
  const [newUser, setNewUser] = useState<CreateUserInput>({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: UserRole.STAFF,
    phoneNumber: '',
    department: '',
    position: ''
  });

  const [editUser, setEditUser] = useState<UpdateUserInput>({
    id: 0,
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    role: UserRole.STAFF,
    status: UserStatus.ACTIVE,
    phoneNumber: '',
    department: '',
    position: ''
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await fetchUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = await createUser(newUser);
      setUsers(prev => [...prev, user]);
      setShowCreateForm(false);
      setNewUser({
        username: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: UserRole.STAFF,
        phoneNumber: '',
        department: '',
        position: ''
      });
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updatedUser = await updateUser(editUser);
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      setShowEditForm(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(id);
        setUsers(prev => prev.filter(u => u.id !== id));
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditUser({
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      phoneNumber: user.phoneNumber,
      department: user.department,
      position: user.position
    });
    setShowEditForm(true);
  };

  const openPermissionsModal = async (user: User) => {
    setSelectedUser(user);
    try {
      const permissions = await fetchUserPermissions(user.id);
      setUserPermissions(permissions);
      setShowPermissionsModal(true);
    } catch (error) {
      console.error('Error loading user permissions:', error);
    }
  };

  const handlePermissionToggle = async (permission: string) => {
    if (!selectedUser) return;
    
    try {
      if (userPermissions.includes(permission)) {
        await revokePermission(selectedUser.id, permission);
        setUserPermissions(prev => prev.filter(p => p !== permission));
      } else {
        await grantPermission(selectedUser.id, permission);
        setUserPermissions(prev => [...prev, permission]);
      }
    } catch (error) {
      console.error('Error toggling permission:', error);
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return '#dc2626';
      case UserRole.MANAGER: return '#d97706';
      case UserRole.STAFF: return '#059669';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case UserStatus.ACTIVE: return '#10b981';
      case UserStatus.INACTIVE: return '#6b7280';
      case UserStatus.SUSPENDED: return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="user-management-loading">
        <div className="loading-spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <PermissionGuard 
      permission="user:read"
      fallback={
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>You don't have permission to view user management.</p>
        </div>
      }
    >
      <div className="user-management">
        <div className="user-management-header">
          <div>
            <h1>User Management</h1>
            <p>Manage users, roles, and permissions</p>
          </div>
          
          <PermissionGuard permission="user:create">
            <button 
              className="btn-primary"
              onClick={() => setShowCreateForm(true)}
            >
              + Add User
            </button>
          </PermissionGuard>
        </div>

        <div className="users-grid">
          {users.map(user => (
            <div key={user.id} className="user-card">
              <div className="user-card-header">
                <div className="user-avatar">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.fullName} />
                  ) : (
                    <div className="avatar-placeholder">
                      {user.firstName?.[0] || user.username[0]}
                    </div>
                  )}
                </div>
                <div className="user-info">
                  <h3>{user.fullName}</h3>
                  <p>@{user.username}</p>
                  <p>{user.email}</p>
                </div>
              </div>

              <div className="user-card-body">
                <div className="user-badges">
                  <span 
                    className="role-badge" 
                    style={{ backgroundColor: getRoleColor(user.role) }}
                  >
                    {user.role.toUpperCase()}
                  </span>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(user.status) }}
                  >
                    {user.status.toUpperCase()}
                  </span>
                </div>

                <div className="user-details">
                  {user.department && (
                    <p><strong>Department:</strong> {user.department}</p>
                  )}
                  {user.position && (
                    <p><strong>Position:</strong> {user.position}</p>
                  )}
                  {user.lastLoginAt && (
                    <p><strong>Last Login:</strong> {new Date(user.lastLoginAt).toLocaleDateString()}</p>
                  )}
                </div>
              </div>

              <div className="user-card-actions">
                <PermissionGuard permission="user:update">
                  <button 
                    className="btn-secondary"
                    onClick={() => openEditModal(user)}
                  >
                    Edit
                  </button>
                </PermissionGuard>
                
                <PermissionGuard permission="user:permissions">
                  <button 
                    className="btn-secondary"
                    onClick={() => openPermissionsModal(user)}
                  >
                    Permissions
                  </button>
                </PermissionGuard>
                
                <PermissionGuard permission="user:delete">
                  <button 
                    className="btn-danger"
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    Delete
                  </button>
                </PermissionGuard>
              </div>
            </div>
          ))}
        </div>

        {/* Create User Modal */}
        {showCreateForm && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Create New User</h3>
              <form onSubmit={handleCreateUser}>
                <div className="form-grid">
                  <div>
                    <label>Username *</label>
                    <input
                      type="text"
                      value={newUser.username}
                      onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label>Email *</label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label>Password *</label>
                    <input
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label>Role *</label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({...newUser, role: e.target.value as UserRole})}
                    >
                      <option value={UserRole.STAFF}>Staff</option>
                      <option value={UserRole.MANAGER}>Manager</option>
                      <option value={UserRole.ADMIN}>Admin</option>
                    </select>
                  </div>
                  <div>
                    <label>First Name</label>
                    <input
                      type="text"
                      value={newUser.firstName}
                      onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                    />
                  </div>
                  <div>
                    <label>Last Name</label>
                    <input
                      type="text"
                      value={newUser.lastName}
                      onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                    />
                  </div>
                  <div>
                    <label>Department</label>
                    <input
                      type="text"
                      value={newUser.department}
                      onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                    />
                  </div>
                  <div>
                    <label>Position</label>
                    <input
                      type="text"
                      value={newUser.position}
                      onChange={(e) => setNewUser({...newUser, position: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="modal-actions">
                  <button type="button" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Create User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditForm && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Edit User</h3>
              <form onSubmit={handleEditUser}>
                <div className="form-grid">
                  <div>
                    <label>Username *</label>
                    <input
                      type="text"
                      value={editUser.username}
                      onChange={(e) => setEditUser({...editUser, username: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label>Email *</label>
                    <input
                      type="email"
                      value={editUser.email}
                      onChange={(e) => setEditUser({...editUser, email: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label>Role *</label>
                    <select
                      value={editUser.role}
                      onChange={(e) => setEditUser({...editUser, role: e.target.value as UserRole})}
                    >
                      <option value={UserRole.STAFF}>Staff</option>
                      <option value={UserRole.MANAGER}>Manager</option>
                      <option value={UserRole.ADMIN}>Admin</option>
                    </select>
                  </div>
                  <div>
                    <label>Status *</label>
                    <select
                      value={editUser.status}
                      onChange={(e) => setEditUser({...editUser, status: e.target.value as UserStatus})}
                    >
                      <option value={UserStatus.ACTIVE}>Active</option>
                      <option value={UserStatus.INACTIVE}>Inactive</option>
                      <option value={UserStatus.SUSPENDED}>Suspended</option>
                    </select>
                  </div>
                  <div>
                    <label>First Name</label>
                    <input
                      type="text"
                      value={editUser.firstName || ''}
                      onChange={(e) => setEditUser({...editUser, firstName: e.target.value})}
                    />
                  </div>
                  <div>
                    <label>Last Name</label>
                    <input
                      type="text"
                      value={editUser.lastName || ''}
                      onChange={(e) => setEditUser({...editUser, lastName: e.target.value})}
                    />
                  </div>
                  <div>
                    <label>Department</label>
                    <input
                      type="text"
                      value={editUser.department || ''}
                      onChange={(e) => setEditUser({...editUser, department: e.target.value})}
                    />
                  </div>
                  <div>
                    <label>Position</label>
                    <input
                      type="text"
                      value={editUser.position || ''}
                      onChange={(e) => setEditUser({...editUser, position: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="modal-actions">
                  <button type="button" onClick={() => setShowEditForm(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Update User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Permissions Modal */}
        {showPermissionsModal && selectedUser && (
          <div className="modal-overlay">
            <div className="modal-content permissions-modal">
              <h3>Manage Permissions - {selectedUser.fullName}</h3>
              
              <div className="permissions-grid">
                {AVAILABLE_PERMISSIONS.map(permission => (
                  <div key={permission} className="permission-item">
                    <label>
                      <input
                        type="checkbox"
                        checked={userPermissions.includes(permission)}
                        onChange={() => handlePermissionToggle(permission)}
                      />
                      <span className="permission-name">{permission}</span>
                    </label>
                  </div>
                ))}
              </div>
              
              <div className="modal-actions">
                <button onClick={() => setShowPermissionsModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}
