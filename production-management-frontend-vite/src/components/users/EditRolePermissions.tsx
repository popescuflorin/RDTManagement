import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { rolePermissionApi } from '../../services/api';
import type { PermissionInfo } from '../../types';
import { Shield, Check} from 'lucide-react';
import { Modal, Form, FormSection, Loader, ErrorMessage } from '../atoms';

interface EditRolePermissionsProps {
  role: string;
  onClose: () => void;
  onPermissionsUpdated: () => void;
}

const EditRolePermissions: React.FC<EditRolePermissionsProps> = ({ role, onClose, onPermissionsUpdated }) => {
  const { t } = useTranslation(['users', 'common']);
  const [allPermissions, setAllPermissions] = useState<Record<string, PermissionInfo[]>>({});
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [role]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [permissionsResponse, rolePermsResponse] = await Promise.all([
        rolePermissionApi.getAllPermissions(),
        rolePermissionApi.getRolePermissions(role)
      ]);

      setAllPermissions(permissionsResponse.data);
      setSelectedPermissions(rolePermsResponse.data.permissions);
    } catch (err: any) {
      console.error('Error loading permissions:', err);
      setError(err.response?.data?.message || t('editRolePermissions.messages.failedToLoadPermissions'));
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
    try {
      setIsSaving(true);
      setError(null);

      await rolePermissionApi.updateRolePermissions(role, {
        role,
        permissions: selectedPermissions
      });

      onPermissionsUpdated();
    } catch (err: any) {
      console.error('Error saving permissions:', err);
      setError(err.response?.data?.message || t('editRolePermissions.messages.failedToSavePermissions'));
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
      title={t('editRolePermissions.title', { role })}
      titleIcon={Shield}
      onSubmit={handleSubmit}
      submitText={isSaving ? t('editRolePermissions.buttons.saving') : t('editRolePermissions.buttons.saveChanges')}
      cancelText={t('editRolePermissions.buttons.cancel')}
      isSubmitting={isSaving || isLoading}
    >
      <Form onSubmit={handleSubmit}>
        {error && <ErrorMessage message={error} />}

        {isLoading ? (
          <Loader message={t('editRolePermissions.labels.loadingPermissions')} />
        ) : (
            <FormSection title={t('editRolePermissions.labels.managePermissions', { defaultValue: 'Manage Permissions' })}>
              <div className="permissions-summary">
                <p>
                  {t('editRolePermissions.labels.selected')} <strong>{selectedPermissions.length}</strong> {t('editRolePermissions.labels.of')}{' '}
                  <strong>{Object.values(allPermissions).flat().length}</strong> {t('editRolePermissions.labels.permissions')}
                </p>
              </div>

              <div className="permissions-grid">
                {Object.entries(allPermissions).map(([category, permissions]) => (
                  <div key={category} className="permission-category">
                    <div className="category-header">
                      <label className="category-checkbox">
                        <input
                          type="checkbox"
                          checked={isCategoryFullySelected(category)}
                          // @ts-ignore
                          indeterminate={isCategoryPartiallySelected(category)}
                          onChange={() => handleCategoryToggle(category)}
                        />
                        <h3>{category}</h3>
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
                            onChange={() => handlePermissionToggle(permission.key)}
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
                ))}
              </div>
            </FormSection>
          )}
      </Form>
    </Modal>
  );
};

export default EditRolePermissions;

