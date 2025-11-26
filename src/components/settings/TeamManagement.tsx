import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';

const GET_TEAM_MEMBERS = gql`
  query GetTeamMembers {
    teamMembers {
      id
      username
      email
      firstName
      lastName
      tenantRole
      department
      position
      status
      lastLoginAt
      createdAt
    }
  }
`;

const CREATE_TEAM_MEMBER = gql`
  mutation CreateTeamMember($input: CreateTeamMemberInput!) {
    createTeamMember(input: $input) {
      user {
        id
        username
        email
        firstName
        lastName
        tenantRole
      }
      invitationSent
    }
  }
`;

const UPDATE_TEAM_MEMBER = gql`
  mutation UpdateTeamMember($input: UpdateTeamMemberInput!) {
    updateTeamMember(input: $input) {
      id
      tenantRole
      department
      position
      status
    }
  }
`;

const REMOVE_TEAM_MEMBER = gql`
  mutation RemoveTeamMember($userId: Int!) {
    removeTeamMember(userId: $userId)
  }
`;

export const TeamManagement: React.FC = () => {
  const [showAddMember, setShowAddMember] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  
  const { data, loading, refetch } = useQuery(GET_TEAM_MEMBERS);
  const [createTeamMember, { loading: creating }] = useMutation(CREATE_TEAM_MEMBER);
  const [updateTeamMember, { loading: updating }] = useMutation(UPDATE_TEAM_MEMBER);
  const [removeTeamMember] = useMutation(REMOVE_TEAM_MEMBER);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    tenantRole: 'member',
    department: '',
    position: '',
    phoneNumber: ''
  });

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createTeamMember({
        variables: { input: formData }
      });

      // Reset form and close dialog
      setFormData({
        username: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        tenantRole: 'member',
        department: '',
        position: '',
        phoneNumber: ''
      });
      setShowAddMember(false);
      refetch();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateTeamMember({
        variables: {
          input: {
            userId: editingMember.id,
            tenantRole: formData.tenantRole,
            department: formData.department,
            position: formData.position
          }
        }
      });

      setEditingMember(null);
      refetch();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleRemoveMember = async (userId: number, username: string) => {
    if (!confirm(`Are you sure you want to remove ${username}?`)) return;

    try {
      await removeTeamMember({ variables: { userId } });
      refetch();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'manager': return 'bg-green-100 text-green-800';
      case 'member': return 'bg-gray-100 text-gray-800';
      case 'readonly': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div>Loading team members...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Team Members</h2>
          <p className="text-gray-600">Manage your team and their access levels</p>
        </div>
        <button
          onClick={() => setShowAddMember(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          + Add Team Member
        </button>
      </div>

      {/* Team Members Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data?.teamMembers.map((member: any) => (
              <tr key={member.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">
                    {member.firstName} {member.lastName}
                  </div>
                  <div className="text-sm text-gray-500">@{member.username}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {member.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(member.tenantRole)}`}>
                    {member.tenantRole}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {member.department || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {member.lastLoginAt ? new Date(member.lastLoginAt).toLocaleDateString() : 'Never'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {member.tenantRole !== 'owner' && (
                    <>
                      <button
                        onClick={() => {
                          setEditingMember(member);
                          setFormData({
                            ...formData,
                            tenantRole: member.tenantRole,
                            department: member.department || '',
                            position: member.position || ''
                          });
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleRemoveMember(member.id, member.username)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Remove
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Add Team Member</h3>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Username *</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Password *</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Role *</label>
                <select
                  value={formData.tenantRole}
                  onChange={(e) => setFormData({ ...formData, tenantRole: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                >
                  <option value="member">Member</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                  <option value="readonly">Read-Only</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Admin: Full access | Manager: Can manage inventory | Member: Basic access | Read-Only: View only
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="e.g., Sales, Warehouse"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Position</label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="e.g., Sales Manager"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddMember(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {creating ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {editingMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Edit Team Member</h3>
            <form onSubmit={handleUpdateMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select
                  value={formData.tenantRole}
                  onChange={(e) => setFormData({ ...formData, tenantRole: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                >
                  <option value="member">Member</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                  <option value="readonly">Read-Only</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Position</label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {updating ? 'Updating...' : 'Update Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
