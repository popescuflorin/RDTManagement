import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { userApi } from '../../services/api';
import type { User } from '../../types';
import './ActivateUser.css';

interface ActivateUserProps {
  user: User;
  onClose: () => void;
  onUserActivated: (updatedUser: User) => void;
}

const ActivateUser: React.FC<ActivateUserProps> = ({ user, onClose, onUserActivated }) => {
  const { t } = useTranslation(['users', 'common']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleActivate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Update the user with isActive set to true
      const response = await userApi.updateUser(user.id, {
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: true,
        receiveEmails: user.receiveEmails
      });
      onUserActivated(response.data);
      onClose();
    } catch (error: any) {
      console.error('Error activating user:', error);
      const errorMessage = error.response?.data?.message || t('activateUser.messages.failedToActivateUser');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="activate-user-overlay">
      <div className="activate-user-modal">
        <div className="activate-user-header">
          <div className="success-icon">✓</div>
          <h2>{t('activateUser.title')}</h2>
        </div>

        <div className="activate-user-content">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <p className="confirmation-text">
            {t('activateUser.confirmation')}
          </p>

          <div className="user-details">
            <div className="user-avatar">
              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
            </div>
            <div className="user-info">
              <div className="user-name">{user.firstName} {user.lastName}</div>
              <div className="user-email">{user.email}</div>
              <div className="user-role">{t('activateUser.labels.role')} {user.role}</div>
            </div>
          </div>

          <div className="info-text">
            <strong>{t('activateUser.info.title')}</strong>
            <ul>
              <li>{t('activateUser.info.restoreAccess')}</li>
              <li>{t('activateUser.info.allowLogin')}</li>
              <li>{t('activateUser.info.enablePermissions')}</li>
            </ul>
          </div>
        </div>

        <div className="activate-user-actions">
          <button
            type="button"
            onClick={onClose}
            className="cancel-button"
            disabled={isLoading}
          >
            {t('activateUser.buttons.cancel')}
          </button>
          <button
            type="button"
            onClick={handleActivate}
            className="activate-button"
            disabled={isLoading}
          >
            {isLoading ? t('activateUser.buttons.activating') : t('activateUser.buttons.activateUser')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivateUser;

