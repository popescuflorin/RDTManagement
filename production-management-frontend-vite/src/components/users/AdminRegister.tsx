import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { AdminRegisterRequest, User, RoleDto } from '../../types';
import { authApi, rolePermissionApi } from '../../services/api';
import './AdminRegister.css';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className="admin-register-overlay">
      <div className="admin-register-modal">
        <div className="admin-register-header">
          <h2>{t('adminRegister.title')}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="admin-register-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">{t('adminRegister.fields.firstName')}</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                placeholder={t('adminRegister.placeholders.firstName')}
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName">{t('adminRegister.fields.lastName')}</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                placeholder={t('adminRegister.placeholders.lastName')}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="username">{t('adminRegister.fields.username')}</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder={t('adminRegister.placeholders.username')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">{t('adminRegister.fields.email')}</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder={t('adminRegister.placeholders.email')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t('adminRegister.fields.password')}</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder={t('adminRegister.placeholders.password')}
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">{t('adminRegister.fields.role')}</label>
            <select
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
            </select>
          </div>

          <div className="form-group checkbox-group">
            <div className="checkbox-wrapper">
              <input
                type="checkbox"
                id="receiveEmails"
                name="receiveEmails"
                checked={formData.receiveEmails}
                onChange={handleChange}
                disabled={isLoading}
                className="checkbox-input"
              />
              <label htmlFor="receiveEmails" className="checkbox-label-wrapper">
                <span className="checkbox-main-label">
                  {t('adminRegister.labels.enableEmailNotifications')}
                </span>
                <span className="checkbox-description">
                  {t('adminRegister.labels.emailNotificationsDescription')}
                </span>
              </label>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-button" onClick={onClose} disabled={isLoading}>
              {t('adminRegister.buttons.cancel')}
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={isLoading || isLoadingRoles}
            >
              {isLoading ? t('adminRegister.buttons.creating') : isLoadingRoles ? t('adminRegister.buttons.loading') : t('adminRegister.buttons.createUser')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminRegister;
