import React, { useState, useEffect, useRef } from 'react';
import { rolePermissionApi } from '../../services/api';
import type { PermissionInfo, CreateRoleRequest, RoleDto } from '../../types';
import { Check, X, Plus } from 'lucide-react';
import './CreateRole.css';

interface CreateRoleProps {
  onClose: () => void;
  onRoleCreated: (role: RoleDto) => void;
}

interface PermissionCategoryProps {
  category: string;
  permissions: PermissionInfo[];
  selectedPermissions: string[];
  isFullySelected: boolean;
  isPartiallySelected: boolean;
  onCategoryToggle: () => void;
  onPermissionToggle: (permissionKey: string) => void;
  disabled: boolean;
}

const PermissionCategory: React.FC<PermissionCategoryProps> = ({
  category,
  permissions,
  selectedPermissions,
  isFullySelected,
  isPartiallySelected,
  onCategoryToggle,
  onPermissionToggle,
  disabled
}) => {
  const checkboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = isPartiallySelected;
    }
  }, [isPartiallySelected]);

  return (
    <div className="permission-category">
      <div className="category-header">
        <label className="category-checkbox">
          <input
            ref={checkboxRef}
            type="checkbox"
            checked={isFullySelected}
            onChange={onCategoryToggle}
            disabled={disabled}
          />
          <h4>{category}</h4>
        </label>
        <span className="category-count">
          {permissions.filter(p => selectedPermissions.includes(p.key)).length} / {permissions.length}
        </span>
      </div>

      <div className="permissions-list">
        {permissions.map((permission) => (
          <label key={permission.key} className="permission-item">
            <input
              type="checkbox"
              checked={selectedPermissions.includes(permission.key)}
              onChange={() => onPermissionToggle(permission.key)}
              disabled={disabled}
            />
            <div className="permission-details">
              <div className="permission-name">{permission.name}</div>
              <div className="permission-description">{permission.description}</div>
            </div>
            {selectedPermissions.includes(permission.key) && (
              <Check size={16} className="check-icon" />
            )}
          </label>
        ))}
      </div>
    </div>
  );
};

const CreateRole: React.FC<CreateRoleProps> = ({ onClose, onRoleCreated }) => {
  const [allPermissions, setAllPermissions] = useState<Record<string, PermissionInfo[]>>({});
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [roleName, setRoleName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const permissionsResponse = await rolePermissionApi.getAllPermissions();
      setAllPermissions(permissionsResponse.data);
    } catch (err: any) {
      console.error('Error loading permissions:', err);
      setError(err.response?.data?.message || 'Failed to load permissions');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePermissionToggle = (permissionKey: string) => {
    setSelectedPermissions(prev => {
      if (prev.includes(permissionKey)) {
        return prev.filter(p => p !== permissionKey);
      } else {
        return [...prev, permissionKey];
      }
    });
  };

  const handleCategoryToggle = (category: string) => {
    const categoryPermissions = allPermissions[category].map(p => p.key);
    const allSelected = categoryPermissions.every(p => selectedPermissions.includes(p));

    if (allSelected) {
      // Deselect all in this category
      setSelectedPermissions(prev => prev.filter(p => !categoryPermissions.includes(p)));
    } else {
      // Select all in this category
      setSelectedPermissions(prev => {
        const newPerms = new Set([...prev, ...categoryPermissions]);
        return Array.from(newPerms);
      });
    }
  };

  const isCategoryFullySelected = (category: string) => {
    const categoryPermissions = allPermissions[category].map(p => p.key);
    return categoryPermissions.every(p => selectedPermissions.includes(p));
  };

  const isCategoryPartiallySelected = (category: string) => {
    const categoryPermissions = allPermissions[category].map(p => p.key);
    const selected = categoryPermissions.filter(p => selectedPermissions.includes(p));
    return selected.length > 0 && selected.length < categoryPermissions.length;
  };

  const handleSave = async () => {
    if (!roleName.trim()) {
      setError('Role name is required');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const request: CreateRoleRequest = {
        name: roleName.trim(),
        description: description.trim() || undefined,
        permissions: selectedPermissions
      };

      const response = await rolePermissionApi.createRole(request);
      onRoleCreated(response.data);
    } catch (err: any) {
      console.error('Error creating role:', err);
      setError(err.response?.data?.message || 'Failed to create role');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="create-role-overlay" onClick={handleBackdropClick}>
      <div className="create-role-modal" onClick={(e) => e.stopPropagation()}>
        <div className="create-role-header">
          <div className="header-content">
            <Plus size={24} />
            <h2>Create New Role</h2>
          </div>
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="create-role-content">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="loading-state">
              <p>Loading permissions...</p>
            </div>
          ) : (
            <>
              {/* Role Details */}
              <div className="role-details-section">
                <div className="form-group">
                  <label htmlFor="roleName">
                    Role Name <span className="required">*</span>
                  </label>
                  <input
                    id="roleName"
                    type="text"
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    placeholder="e.g., Supervisor, Operator, Analyst"
                    maxLength={50}
                    disabled={isSaving}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of this role's purpose and responsibilities"
                    rows={3}
                    maxLength={500}
                    disabled={isSaving}
                  />
                </div>
              </div>

              {/* Permissions Selection */}
              <div className="permissions-selection-section">
                <h3>Assign Permissions</h3>
                <div className="permissions-summary">
                  <p>
                    Selected <strong>{selectedPermissions.length}</strong> of{' '}
                    <strong>{Object.values(allPermissions).flat().length}</strong> permissions
                  </p>
                </div>

                <div className="permissions-grid">
                  {Object.entries(allPermissions).map(([category, permissions]) => (
                    <PermissionCategory
                      key={category}
                      category={category}
                      permissions={permissions}
                      selectedPermissions={selectedPermissions}
                      isFullySelected={isCategoryFullySelected(category)}
                      isPartiallySelected={isCategoryPartiallySelected(category)}
                      onCategoryToggle={() => handleCategoryToggle(category)}
                      onPermissionToggle={handlePermissionToggle}
                      disabled={isSaving}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="create-role-actions">
          <button
            type="button"
            onClick={onClose}
            className="cancel-button"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="save-button"
            disabled={isSaving || isLoading || !roleName.trim()}
          >
            {isSaving ? 'Creating...' : 'Create Role'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateRole;

