import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { AdminRegisterRequest, User, RoleDto } from '../../types';
import { authApi, rolePermissionApi } from '../../services/api';
import { Modal, Form, FormSection, FormRow, FormGroup, Label, Input, Select, Checkbox, ErrorMessage } from '../atoms';
import { UserPlus } from 'lucide-react';

interface AdminRegisterProps {
  onClose: () => void;
  onUserCreated: (user: User) => void;
}

const AdminRegister: React.FC<AdminRegisterProps> = ({ onClose, onUserCreated }) => {
  const { t } = useTranslation(['users', 'common']);
  const [formData, setFormData] = useState<AdminRegisterRequest>({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: '',
    receiveEmails: true
  });
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setIsLoadingRoles(true);
      const response = await rolePermissionApi.getAllRoles();
      setRoles(response.data);
    } catch (err: any) {
      console.error('Error loading roles:', err);
      setError(t('adminRegister.messages.failedToLoadRoles'));
    } finally {
      setIsLoadingRoles(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.adminRegister(formData);
      onUserCreated(response.data);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || t('adminRegister.messages.failedToCreateUser'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={t('adminRegister.title')}
      titleIcon={UserPlus}
      onSubmit={handleSubmit}
      submitText={isLoading ? t('adminRegister.buttons.creating') : isLoadingRoles ? t('adminRegister.buttons.loading') : t('adminRegister.buttons.createUser')}
      cancelText={t('adminRegister.buttons.cancel')}
      isSubmitting={isLoading || isLoadingRoles}
    >
      <Form onSubmit={handleSubmit}>
        {error && <ErrorMessage message={error} />}

        <FormSection title={t('adminRegister.sections.personalInfo', { defaultValue: 'Personal Information' })}>
          <FormRow>
            <FormGroup>
              <Label htmlFor="firstName">{t('adminRegister.fields.firstName')}</Label>
              <Input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                placeholder={t('adminRegister.placeholders.firstName')}
                disabled={isLoading}
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="lastName">{t('adminRegister.fields.lastName')}</Label>
              <Input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                placeholder={t('adminRegister.placeholders.lastName')}
                disabled={isLoading}
              />
            </FormGroup>
          </FormRow>
        </FormSection>

        <FormSection title={t('adminRegister.sections.accountDetails', { defaultValue: 'Account Details' })}>
          <FormGroup>
            <Label htmlFor="username">{t('adminRegister.fields.username')}</Label>
            <Input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder={t('adminRegister.placeholders.username')}
              disabled={isLoading}
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="email">{t('adminRegister.fields.email')}</Label>
            <Input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder={t('adminRegister.placeholders.email')}
              disabled={isLoading}
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="password">{t('adminRegister.fields.password')}</Label>
            <Input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder={t('adminRegister.placeholders.password')}
              minLength={6}
              disabled={isLoading}
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="role">{t('adminRegister.fields.role')}</Label>
            <Select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              disabled={isLoadingRoles || isLoading}
            >
              {isLoadingRoles ? (
                <option value="">{t('adminRegister.labels.loadingRoles')}</option>
              ) : roles.length === 0 ? (
                <option value="">{t('adminRegister.labels.noRolesAvailable')}</option>
              ) : (
                <>
                  <option value="">{t('adminRegister.labels.selectRole')}</option>
                  {roles.map((role) => (
                    <option key={role.name} value={role.name}>
                      {role.name}
                      {role.description && ` - ${role.description}`}
                    </option>
                  ))}
                </>
              )}
            </Select>
          </FormGroup>

          <Checkbox
            id="receiveEmails"
            name="receiveEmails"
            checked={formData.receiveEmails}
            onChange={handleChange}
            disabled={isLoading}
            label={t('adminRegister.labels.enableEmailNotifications')}
          />
        </FormSection>
      </Form>
    </Modal>
  );
};

export default AdminRegister;
