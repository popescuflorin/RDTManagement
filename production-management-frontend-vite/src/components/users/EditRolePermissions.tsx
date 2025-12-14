import React, { useState, useEffect, useRef } from 'react';
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

interface PermissionCategoryProps {
  category: string;
  permissions: PermissionInfo[];
  selectedPermissions: string[];
  isFullySelected: boolean;
  isPartiallySelected: boolean;
  onCategoryToggle: () => void;
  onPermissionToggle: (permissionKey: string) => void;
}

const PermissionCategory: React.FC<PermissionCategoryProps> = ({
  category,
  permissions,
  selectedPermissions,
  isFullySelected,
  isPartiallySelected,
  onCategoryToggle,
  onPermissionToggle
}) => {
  const checkboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = isPartiallySelected;
    }
  }, [isPartiallySelected]);

  return (
    <div style={{ 
      marginBottom: 'var(--space-lg)',
      padding: 'var(--space-md)', 
      border: '1px solid var(--border)', 
      borderRadius: 'var(--radius-md)',
      backgroundColor: 'var(--surface)'
    }}>
      <div style={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--space-md)',
        paddingBottom: 'var(--space-sm)',
        borderBottom: '1px solid var(--border)'
      }}>
        <label style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-sm)',
          cursor: 'pointer'
        }}>
          <input
            ref={checkboxRef}
            type="checkbox"
            checked={isFullySelected}
            onChange={onCategoryToggle}
            style={{ 
              width: '18px',
              height: '18px',
              cursor: 'pointer'
            }}
          />
          <h3 style={{ 
            margin: 0,
            fontSize: 'var(--text-base)',
            fontWeight: 600,
            color: 'var(--text-primary)'
          }}>
            {category}
          </h3>
        </label>
        <span style={{ 
          fontSize: 'var(--text-sm)',
          color: 'var(--text-secondary)',
          fontWeight: 500
        }}>
          {permissions.filter(p => selectedPermissions.includes(p.key)).length} / {permissions.length}
        </span>
      </div>

      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-xs)'
      }}>
        {permissions.map((permission) => (
          <label 
            key={permission.key} 
            style={{ 
              display: 'flex',
              alignItems: 'flex-start',
              gap: 'var(--space-sm)',
              padding: 'var(--space-sm)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              backgroundColor: selectedPermissions.includes(permission.key) ? 'var(--primary-50)' : 'transparent',
              border: `1px solid ${selectedPermissions.includes(permission.key) ? 'var(--primary-200)' : 'transparent'}`,
              transition: 'all var(--transition-fast)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = selectedPermissions.includes(permission.key) ? 'var(--primary-100)' : 'var(--surface-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = selectedPermissions.includes(permission.key) ? 'var(--primary-50)' : 'transparent';
            }}
          >
            <input
              type="checkbox"
              checked={selectedPermissions.includes(permission.key)}
              onChange={() => onPermissionToggle(permission.key)}
              style={{ 
                width: '16px',
                height: '16px',
                marginTop: '2px',
                cursor: 'pointer'
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ 
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                color: 'var(--text-primary)',
                marginBottom: '2px'
              }}>
                {permission.name}
              </div>
              <div style={{ 
                fontSize: 'var(--text-xs)',
                color: 'var(--text-secondary)',
                lineHeight: 1.4
              }}>
                {permission.description}
              </div>
            </div>
            {selectedPermissions.includes(permission.key) && (
              <Check size={16} style={{ 
                color: 'var(--primary-600)',
                flexShrink: 0,
                marginTop: '2px'
              }} />
            )}
          </label>
        ))}
      </div>
    </div>
  );
};

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
            <div style={{ 
              padding: 'var(--space-md)', 
              backgroundColor: 'var(--info-50)', 
              border: '1px solid var(--info-200)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-lg)'
            }}>
              <p style={{ 
                margin: 0,
                fontSize: 'var(--text-sm)',
                color: 'var(--info-700)'
              }}>
                {t('editRolePermissions.labels.selected')} <strong>{selectedPermissions.length}</strong> {t('editRolePermissions.labels.of')}{' '}
                <strong>{Object.values(allPermissions).flat().length}</strong> {t('editRolePermissions.labels.permissions')}
              </p>
            </div>

            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 'var(--space-lg)'
            }}>
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
                />
              ))}
            </div>
          </FormSection>
        )}
      </Form>
    </Modal>
  );
};

export default EditRolePermissions;

