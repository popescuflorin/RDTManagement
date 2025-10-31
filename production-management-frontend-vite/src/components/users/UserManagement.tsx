import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  AlertTriangle, 
  Loader2,
  RotateCcw,
  UserCheck,
  Shield
} from 'lucide-react';
import { userApi, rolePermissionApi } from '../../services/api';
import type { User, RoleDto } from '../../types';
import AdminRegister from './AdminRegister';
import EditUser from './EditUser';
import DeleteConfirmation from './DeleteConfirmation';
import ActivateUser from './ActivateUser';
import EditRolePermissions from './EditRolePermissions';
import CreateRole from './CreateRole';
import './UserManagement.css';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await userApi.getAllUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Failed to load users. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      setIsLoadingRoles(true);
      const rolesResponse = await rolePermissionApi.getAllRoles();
      
      setRoles(rolesResponse.data);
      
      // Load permission counts for each role
      const permissionCounts: Record<string, number> = {};
      for (const role of rolesResponse.data) {
        const perms = await rolePermissionApi.getRolePermissions(role.name);
        permissionCounts[role.name] = perms.data.permissions.length;
      }
      setRolePermissions(permissionCounts);
    } catch (error) {
      console.error('Error loading roles:', error);
    } finally {
      setIsLoadingRoles(false);
    }
  };

  const handleUserCreated = (newUser: User) => {
    setUsers(prevUsers => [...prevUsers, newUser]);
    setShowAddModal(false);
    // Show success message or notification here if needed
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleUserUpdated = (updatedUser: User) => {
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === updatedUser.id ? updatedUser : user
      )
    );
    setShowEditModal(false);
    setSelectedUser(null);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleUserDeleted = (userId: number) => {
    setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
    setShowDeleteModal(false);
    setSelectedUser(null);
  };

  const handleActivateUser = (user: User) => {
    setSelectedUser(user);
    setShowActivateModal(true);
  };

  const handleUserActivated = (updatedUser: User) => {
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === updatedUser.id ? updatedUser : user
      )
    );
    setShowActivateModal(false);
    setSelectedUser(null);
  };

  const handleEditRole = (roleName: string) => {
    setSelectedRole(roleName);
    setShowEditRoleModal(true);
  };

  const handleRolePermissionsUpdated = async () => {
    setShowEditRoleModal(false);
    setSelectedRole(null);
    await loadRoles();
  };

  const handleCreateRole = () => {
    setShowCreateRoleModal(true);
  };

  const handleRoleCreated = async () => {
    setShowCreateRoleModal(false);
    await loadRoles();
  };

  const closeModals = () => {
    setShowEditModal(false);
    setShowDeleteModal(false);
    setShowActivateModal(false);
    setShowEditRoleModal(false);
    setShowCreateRoleModal(false);
    setSelectedUser(null);
    setSelectedRole(null);
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'Never';
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'role-badge role-admin';
      case 'manager':
        return 'role-badge role-manager';
      case 'user':
        return 'role-badge role-user';
      default:
        return 'role-badge role-default';
    }
  };

  if (isLoading) {
    return (
      <div className="user-management-container">
        <div className="loading-state">
          <Loader2 size={32} className="animate-spin" />
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-management-container">
        <div className="error-state">
          <AlertTriangle size={32} className="error-icon" />
          <p>{error}</p>
          <button onClick={loadUsers} className="btn btn-primary">
            <RotateCcw size={16} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-management-container">
      <div className="user-management-header">
        <div className="header-left">
          <h1>User & Role Management</h1>
          <p>Manage system users, roles, and permissions</p>
        </div>
        <div className="header-right">
          {activeTab === 'users' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary"
            >
              <UserPlus size={16} />
              Add New User
            </button>
          )}
          {activeTab === 'roles' && (
            <button
              onClick={handleCreateRole}
              className="btn btn-success"
            >
              <Shield size={16} />
              Create New Role
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={18} />
          Users
        </button>
        <button
          className={`tab-button ${activeTab === 'roles' ? 'active' : ''}`}
          onClick={() => setActiveTab('roles')}
        >
          <Shield size={18} />
          Roles & Permissions
        </button>
      </div>

      {activeTab === 'users' && (
        <>
          <div className="user-management-controls">
        <div className="search-container">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search users by name, email, username, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="users-count">
          <span className="count-badge">{filteredUsers.length}</span>
          {filteredUsers.length === 1 ? 'user' : 'users'} found
        </div>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Avatar</th>
              <th>Name</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Last Login</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="user-row">
                <td className="avatar-cell">
                  <div className="user-avatar">
                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                  </div>
                </td>
                <td className="name-cell">
                  <div className="user-name">
                    <span className="full-name">{user.firstName} {user.lastName}</span>
                    <span className="user-id">ID: {user.id}</span>
                  </div>
                </td>
                <td className="username-cell">
                  <span className="username">{user.username}</span>
                </td>
                <td className="email-cell">
                  <span className="email">{user.email}</span>
                </td>
                <td className="role-cell">
                  <span className={getRoleBadgeClass(user.role)}>
                    {user.role}
                  </span>
                </td>
                <td className="login-cell">
                  <span className="last-login">
                    {formatDate(user.lastLoginAt?.toString() || '')}
                  </span>
                </td>
                <td className="status-cell">
                  <span className={`status-badge ${user.isActive ? 'status-active' : 'status-inactive'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="actions-cell">
                  <div className="action-buttons">
                    <button 
                      className="btn btn-sm btn-warning" 
                      title="Edit User"
                      onClick={() => handleEditUser(user)}
                    >
                      <Edit size={16} />
                    </button>
                    {user.isActive ? (
                      <button 
                        className="btn btn-sm btn-danger" 
                        title="Deactivate User"
                        onClick={() => handleDeleteUser(user)}
                      >
                        <Trash2 size={16} />
                      </button>
                    ) : (
                      <button 
                        className="btn btn-sm btn-success" 
                        title="Activate User"
                        onClick={() => handleActivateUser(user)}
                      >
                        <UserCheck size={16} />
                      </button>
                    )}
                    <button className="btn btn-sm btn-secondary" title="View Details">
                      <Eye size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && !isLoading && (
          <div className="empty-state">
            <Users size={48} className="empty-icon" />
            <h3>No users found</h3>
            <p>
              {searchTerm
                ? `No users match "${searchTerm}". Try adjusting your search.`
                : 'No users in the system yet.'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowAddModal(true)}
                className="btn btn-primary"
              >
                <UserPlus size={16} />
                Add First User
              </button>
            )}
          </div>
        )}
      </div>
        </>
      )}

      {activeTab === 'roles' && (
        <div className="roles-container">
          {isLoadingRoles ? (
            <div className="loading-state">
              <Loader2 size={32} className="animate-spin" />
              <p>Loading roles...</p>
            </div>
          ) : (
            <div className="roles-table-container">
              <table className="roles-table">
                <thead>
                  <tr>
                    <th>Role</th>
                    <th>Description</th>
                    <th>Permissions Count</th>
                    <th>Users</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((role) => (
                    <tr key={role.id} className="role-row">
                      <td className="role-name-cell">
                        <span className={getRoleBadgeClass(role.name)}>
                          <Shield size={14} />
                          {role.name}
                        </span>
                      </td>
                      <td className="role-description-cell">
                        {role.description || 'No description available'}
                      </td>
                      <td className="permissions-count-cell">
                        <span className="permission-badge">
                          {rolePermissions[role.name] || 0} permissions
                        </span>
                      </td>
                      <td className="users-count-cell">
                        {users.filter(u => u.role === role.name).length} users
                      </td>
                      <td className="actions-cell">
                        <div className="action-buttons">
                          <button 
                            className="btn btn-sm btn-warning" 
                            title="Edit Permissions"
                            onClick={() => handleEditRole(role.name)}
                          >
                            <Edit size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {roles.length === 0 && !isLoadingRoles && (
                <div className="empty-state">
                  <Shield size={48} className="empty-icon" />
                  <h3>No roles found</h3>
                  <p>No roles configured in the system.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {showAddModal && (
        <AdminRegister
          onClose={() => setShowAddModal(false)}
          onUserCreated={handleUserCreated}
        />
      )}

      {showEditModal && selectedUser && (
        <EditUser
          user={selectedUser}
          onClose={closeModals}
          onUserUpdated={handleUserUpdated}
        />
      )}

      {showDeleteModal && selectedUser && (
        <DeleteConfirmation
          user={selectedUser}
          onClose={closeModals}
          onUserDeleted={handleUserDeleted}
        />
      )}

      {showActivateModal && selectedUser && (
        <ActivateUser
          user={selectedUser}
          onClose={closeModals}
          onUserActivated={handleUserActivated}
        />
      )}

      {showEditRoleModal && selectedRole && (
        <EditRolePermissions
          role={selectedRole}
          onClose={closeModals}
          onPermissionsUpdated={handleRolePermissionsUpdated}
        />
      )}

      {showCreateRoleModal && (
        <CreateRole
          onClose={closeModals}
          onRoleCreated={handleRoleCreated}
        />
      )}
    </div>
  );
};

export default UserManagement;
