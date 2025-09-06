import React, { useState, useEffect } from 'react';
import { userApi } from '../services/api';
import type { User } from '../types';
import AdminRegister from './AdminRegister';
import './UserManagement.css';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadUsers();
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

  const handleUserCreated = (newUser: User) => {
    setUsers(prevUsers => [...prevUsers, newUser]);
    setShowAddModal(false);
    // Show success message or notification here if needed
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
          <div className="loading-spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-management-container">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <p>{error}</p>
          <button onClick={loadUsers} className="retry-button">
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
          <h1>User Management</h1>
          <p>Manage system users and their roles</p>
        </div>
        <div className="header-right">
          <button
            onClick={() => setShowAddModal(true)}
            className="add-user-button"
          >
            <span className="button-icon">👤</span>
            Add New User
          </button>
        </div>
      </div>

      <div className="user-management-controls">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search users by name, email, username, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
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
                    <button className="action-button edit-button" title="Edit User">
                      ✏️
                    </button>
                    <button className="action-button delete-button" title="Delete User">
                      🗑️
                    </button>
                    <button className="action-button view-button" title="View Details">
                      👁️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && !isLoading && (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>No users found</h3>
            <p>
              {searchTerm
                ? `No users match "${searchTerm}". Try adjusting your search.`
                : 'No users in the system yet.'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowAddModal(true)}
                className="empty-add-button"
              >
                Add First User
              </button>
            )}
          </div>
        )}
      </div>

      {showAddModal && (
        <AdminRegister
          onClose={() => setShowAddModal(false)}
          onUserCreated={handleUserCreated}
        />
      )}
    </div>
  );
};

export default UserManagement;
