import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Users, 
  UserPlus, 
  Search, 
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
import EditButton from '../atoms/EditButton';
import DeleteButton from '../atoms/DeleteButton';
import CreateButton from '../atoms/CreateButton';
import { Table } from '../atoms';
import type { TableColumn } from '../atoms';
import './UserManagement.css';

const UserManagement: React.FC = () => {
  const { t } = useTranslation(['users', 'common']);
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
      setError(t('userManagement.messages.failedToLoadUsers'));
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
      return t('userManagement.messages.never');
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
          <p>{t('userManagement.loading.loadingUsers')}</p>
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
            {t('userManagement.buttons.tryAgain')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-management-container">
      <div className="user-management-header">
        <div className="header-left">
          <h1>{t('userManagement.title')}</h1>
          <p>{t('userManagement.subtitle')}</p>
        </div>
        <div className="header-right">
          {activeTab === 'users' && (
            <CreateButton
              onClick={() => setShowAddModal(true)}
              variant="primary"
            >
              {t('userManagement.buttons.addNewUser')}
            </CreateButton>
          )}
          {activeTab === 'roles' && (
            <CreateButton
              onClick={handleCreateRole}
              variant="success"
            >
              {t('userManagement.buttons.createNewRole')}
            </CreateButton>
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
          {t('userManagement.tabs.users')}
        </button>
        <button
          className={`tab-button ${activeTab === 'roles' ? 'active' : ''}`}
          onClick={() => setActiveTab('roles')}
        >
          <Shield size={18} />
          {t('userManagement.tabs.roles')}
        </button>
      </div>

      {activeTab === 'users' && (
        <>
          <div className="user-management-controls">
        <div className="search-container">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder={t('userManagement.search.placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="users-count">
          <span className="count-badge">{filteredUsers.length}</span>
          {filteredUsers.length == 1 ? t('userManagement.search.usersFound', { count: filteredUsers.length }) : t('userManagement.search.usersFound_plural', { count: filteredUsers.length })}
        </div>
      </div>

      <div className="users-table-container">
        {filteredUsers.length === 0 && !isLoading ? (
          <div className="empty-state">
            <Users size={48} className="empty-icon" />
            <h3>{t('userManagement.empty.noUsersFound')}</h3>
            <p>
              {searchTerm
                ? t('userManagement.empty.noUsersMatch', { searchTerm })
                : t('userManagement.empty.noUsersInSystem')}
            </p>
            {!searchTerm && (
              <CreateButton
                onClick={() => setShowAddModal(true)}
                variant="primary"
              >
                {t('userManagement.empty.addFirstUser')}
              </CreateButton>
            )}
          </div>
        ) : (
          (() => {
            const columns: TableColumn<User>[] = [
              {
                key: 'avatar',
                label: t('userManagement.table.avatar'),
                render: (_, user) => (
                  <div className="avatar-cell">
                    <div className="user-avatar">
                      {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                    </div>
                  </div>
                ),
                cellClassName: 'avatar-cell'
              },
              {
                key: 'name',
                label: t('userManagement.table.name'),
                render: (_, user) => (
                  <div className="name-cell">
                    <div className="user-name">
                      <span className="full-name">{user.firstName} {user.lastName}</span>
                      <span className="user-id">{t('userManagement.labels.id')} {user.id}</span>
                    </div>
                  </div>
                ),
                cellClassName: 'name-cell'
              },
              {
                key: 'username',
                label: t('userManagement.table.username'),
                render: (_, user) => (
                  <span className="username-cell">
                    <span className="username">{user.username}</span>
                  </span>
                ),
                cellClassName: 'username-cell'
              },
              {
                key: 'email',
                label: t('userManagement.table.email'),
                render: (_, user) => (
                  <span className="email-cell">
                    <span className="email">{user.email}</span>
                  </span>
                ),
                cellClassName: 'email-cell'
              },
              {
                key: 'role',
                label: t('userManagement.table.role'),
                render: (_, user) => (
                  <span className={`role-cell ${getRoleBadgeClass(user.role)}`}>
                    {user.role}
                  </span>
                ),
                cellClassName: 'role-cell'
              },
              {
                key: 'lastLogin',
                label: t('userManagement.table.lastLogin'),
                render: (_, user) => (
                  <span className="login-cell">
                    <span className="last-login">
                      {formatDate(user.lastLoginAt?.toString() || '')}
                    </span>
                  </span>
                ),
                cellClassName: 'login-cell'
              },
              {
                key: 'status',
                label: t('userManagement.table.status'),
                render: (_, user) => (
                  <span className={`status-cell status-badge ${user.isActive ? 'status-active' : 'status-inactive'}`}>
                    {user.isActive ? t('userManagement.status.active') : t('userManagement.status.inactive')}
                  </span>
                ),
                cellClassName: 'status-cell'
              },
              {
                key: 'actions',
                label: t('userManagement.table.actions'),
                render: (_, user) => (
                  <div className="action-buttons">
                    <EditButton
                      title={t('userManagement.tooltips.editUser')}
                      onClick={() => handleEditUser(user)}
                    />
                    {user.isActive ? (
                      <DeleteButton
                        title={t('userManagement.tooltips.deactivateUser')}
                        onClick={() => handleDeleteUser(user)}
                      />
                    ) : (
                      <button 
                        className="btn btn-sm btn-success" 
                        title={t('userManagement.tooltips.activateUser')}
                        onClick={() => handleActivateUser(user)}
                      >
                        <UserCheck size={16} />
                      </button>
                    )}
                  </div>
                ),
                cellClassName: 'actions-cell'
              }
            ];

            return (
              <Table
                columns={columns}
                data={filteredUsers}
                getRowClassName={() => 'user-row'}
                showContainer={false}
              />
            );
          })()
        )}
      </div>
        </>
      )}

      {activeTab === 'roles' && (
        <div className="roles-container">
          {isLoadingRoles ? (
            <div className="loading-state">
              <Loader2 size={32} className="animate-spin" />
              <p>{t('userManagement.loading.loadingRoles')}</p>
            </div>
          ) : (
            <div className="roles-table-container">
              {roles.length === 0 && !isLoadingRoles ? (
                <div className="empty-state">
                  <Shield size={48} className="empty-icon" />
                  <h3>{t('userManagement.empty.noRolesFound')}</h3>
                  <p>{t('userManagement.empty.noRolesConfigured')}</p>
                </div>
              ) : (
                (() => {
                  const columns: TableColumn<RoleDto>[] = [
                    {
                      key: 'name',
                      label: t('userManagement.table.roleColumn'),
                      render: (_, role) => (
                        <span className={`role-name-cell ${getRoleBadgeClass(role.name)}`}>
                          <Shield size={14} />
                          {role.name}
                        </span>
                      ),
                      cellClassName: 'role-name-cell'
                    },
                    {
                      key: 'description',
                      label: t('userManagement.table.description'),
                      render: (_, role) => role.description || t('userManagement.labels.noDescription'),
                      cellClassName: 'role-description-cell'
                    },
                    {
                      key: 'permissionsCount',
                      label: t('userManagement.table.permissionsCount'),
                      render: (_, role) => (
                        <span className="permissions-count-cell permission-badge">
                          {rolePermissions[role.name] || 0} {t('userManagement.labels.permissions')}
                        </span>
                      ),
                      cellClassName: 'permissions-count-cell'
                    },
                    {
                      key: 'users',
                      label: t('userManagement.table.users'),
                      render: (_, role) => (
                        <span className="users-count-cell">
                          {users.filter(u => u.role === role.name).length} {t('userManagement.labels.users')}
                        </span>
                      ),
                      cellClassName: 'users-count-cell'
                    },
                    {
                      key: 'actions',
                      label: t('userManagement.table.actions'),
                      render: (_, role) => (
                        <div className="action-buttons">
                          <EditButton
                            title={t('userManagement.tooltips.editPermissions')}
                            onClick={() => handleEditRole(role.name)}
                          />
                        </div>
                      ),
                      cellClassName: 'actions-cell'
                    }
                  ];

                  return (
                    <Table
                      columns={columns}
                      data={roles}
                      getRowClassName={() => 'role-row'}
                      showContainer={false}
                    />
                  );
                })()
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
