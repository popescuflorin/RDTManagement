import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { userApi } from '../../services/api';
import type { User, AdminUpdateUserRequest } from '../../types';
import './EditUser.css';

interface EditUserProps {
  user: User;
  onClose: () => void;
  onUserUpdated: (updatedUser: User) => void;
}

const EditUser: React.FC<EditUserProps> = ({ user, onClose, onUserUpdated }) => {
  const { t } = useTranslation(['users', 'common']);
  const [formData, setFormData] = useState<AdminUpdateUserRequest>({
    username: user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    isActive: user.isActive,
    receiveEmails: user.receiveEmails
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await userApi.updateUser(user.id, formData);
      onUserUpdated(response.data);
      onClose();
    } catch (error: any) {
      console.error('Error updating user:', error);
      const errorMessage = error.response?.data?.message || t('editUser.messages.failedToUpdateUser');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="edit-user-overlay">
      <div className="edit-user-modal">
        <div className="edit-user-header">
          <h2>{t('editUser.title')}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="edit-user-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">{t('editUser.fields.firstName')}</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">{t('editUser.fields.lastName')}</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="username">{t('editUser.fields.username')}</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">{t('editUser.fields.email')}</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="role">{t('editUser.fields.role')}</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              >
                <option value="">{t('editUser.labels.selectRole')}</option>
                <option value="Admin">{t('editUser.roleOptions.admin')}</option>
                <option value="Manager">{t('editUser.roleOptions.manager')}</option>
                <option value="User">{t('editUser.roleOptions.user')}</option>
              </select>
            </div>
          </div>

          <div className="form-group checkbox-group">
            <div className="checkbox-wrapper">
              <input
                type="checkbox"
                id="receiveEmails"
                name="receiveEmails"
                checked={formData.receiveEmails}
                onChange={handleInputChange}
                disabled={isLoading}
                className="checkbox-input"
              />
              <label htmlFor="receiveEmails" className="checkbox-label-wrapper">
                <span className="checkbox-main-label">
                  {t('editUser.labels.enableEmailNotifications')}
                </span>
                <span className="checkbox-description">
                  {t('editUser.labels.emailNotificationsDescription')}
                </span>
              </label>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="cancel-button"
              disabled={isLoading}
            >
              {t('editUser.buttons.cancel')}
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={isLoading}
            >
              {isLoading ? t('editUser.buttons.updating') : t('editUser.buttons.updateUser')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUser;
