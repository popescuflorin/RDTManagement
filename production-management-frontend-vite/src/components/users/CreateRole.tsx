import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { rolePermissionApi } from '../../services/api';
import type { PermissionInfo, CreateRoleRequest, RoleDto } from '../../types';
import { Check, Shield } from 'lucide-react';
import { Modal, Form, FormSection, FormGroup, Label, Input, Textarea, Loader, ErrorMessage } from '../atoms';

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
  const { t } = useTranslation(['users', 'common']);
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
      setError(err.response?.data?.message || t('createRole.messages.failedToLoadPermissions'));
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
      setError(t('createRole.messages.roleNameRequired'));
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
      setError(err.response?.data?.message || t('createRole.messages.failedToCreateRole'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = () => {
    handleSave();
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={t('createRole.title')}
      titleIcon={Shield}
      onSubmit={handleSubmit}
      submitText={isSaving ? t('createRole.buttons.creating') : t('createRole.buttons.createRole')}
      cancelText={t('createRole.buttons.cancel')}
      isSubmitting={isSaving || isLoading || !roleName.trim()}
    >
      <Form onSubmit={handleSubmit}>
        {error && <ErrorMessage message={error} />}

        {isLoading ? (
          <Loader message={t('createRole.labels.loadingPermissions')} />
        ) : (
          <>
            <FormSection title={t('createRole.sections.roleInfo', { defaultValue: 'Role Information' })}>
              <FormGroup>
                <Label htmlFor="roleName" required>{t('createRole.fields.roleName')}</Label>
                <Input
                  id="roleName"
                  type="text"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder={t('createRole.placeholders.roleName')}
                  maxLength={50}
                  disabled={isSaving}
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="description">{t('createRole.fields.description')}</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('createRole.placeholders.description')}
                  rows={3}
                  maxLength={500}
                  disabled={isSaving}
                />
              </FormGroup>
            </FormSection>

            <FormSection title={t('createRole.labels.assignPermissions')}>
              <div className="permissions-summary">
                <p>
                  {t('createRole.labels.selected')} <strong>{selectedPermissions.length}</strong> {t('createRole.labels.of')}{' '}
                  <strong>{Object.values(allPermissions).flat().length}</strong> {t('createRole.labels.permissions')}
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
            </FormSection>
          </>
        )}
      </Form>
    </Modal>
  );
};

export default CreateRole;

