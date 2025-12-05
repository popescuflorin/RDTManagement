import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { userApi } from '../../services/api';
import type { User } from '../../types';
import './DeleteConfirmation.css';

interface DeleteConfirmationProps {
  user: User;
  onClose: () => void;
  onUserDeleted: (userId: number) => void;
}

const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({ user, onClose, onUserDeleted }) => {
  const { t } = useTranslation(['users', 'common']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await userApi.deleteUser(user.id);
      onUserDeleted(user.id);
      onClose();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      const errorMessage = error.response?.data?.message || t('deleteConfirmation.messages.failedToDeleteUser');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="delete-confirmation-overlay">
      <div className="delete-confirmation-modal">
        <div className="delete-confirmation-header">
          <div className="warning-icon">⚠️</div>
          <h2>{t('deleteConfirmation.title')}</h2>
        </div>

        <div className="delete-confirmation-content">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <p className="confirmation-text">
            {t('deleteConfirmation.confirmation')}
          </p>

          <div className="user-details">
            <div className="user-avatar">
              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
            </div>
            <div className="user-info">
              <div className="user-name">{user.firstName} {user.lastName}</div>
              <div className="user-email">{user.email}</div>
              <div className="user-role">{t('deleteConfirmation.labels.role')} {user.role}</div>
            </div>
          </div>

          <div className="warning-text">
            <strong>{t('deleteConfirmation.warning.title')}</strong> {t('deleteConfirmation.warning.deactivatingWill')}
            <ul>
              <li>{t('deleteConfirmation.warning.blockAccess')}</li>
              <li>{t('deleteConfirmation.warning.preventLogin')}</li>
              <li>{t('deleteConfirmation.warning.keepData')}</li>
              <li>{t('deleteConfirmation.warning.canReactivate')}</li>
            </ul>
          </div>
        </div>

        <div className="delete-confirmation-actions">
          <button
            type="button"
            onClick={onClose}
            className="cancel-button"
            disabled={isLoading}
          >
            {t('deleteConfirmation.buttons.cancel')}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="delete-button"
            disabled={isLoading}
          >
            {isLoading ? t('deleteConfirmation.buttons.deactivating') : t('deleteConfirmation.buttons.deactivateUser')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmation;
