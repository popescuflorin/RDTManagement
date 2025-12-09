import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { userApi } from '../../services/api';
import type { User } from '../../types';
import { Modal, ViewContent, ViewValue, ErrorMessage } from '../atoms';
import { AlertTriangle } from 'lucide-react';

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
    <Modal
      isOpen={true}
      onClose={onClose}
      title={t('deleteConfirmation.title')}
      titleIcon={AlertTriangle}
      onSubmit={handleDelete}
      submitText={isLoading ? t('deleteConfirmation.buttons.deactivating') : t('deleteConfirmation.buttons.deactivateUser')}
      cancelText={t('deleteConfirmation.buttons.cancel')}
      isSubmitting={isLoading}
    >
      <ViewContent>
        {error && <ErrorMessage message={error} />}

        <ViewValue style={{ marginBottom: 'var(--space-lg)', fontSize: 'var(--text-base)' }}>
          {t('deleteConfirmation.confirmation')}
        </ViewValue>

        <div className="user-details">
          <div className="user-avatar">
            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
          </div>
          <div className="user-info">
            <ViewValue style={{ fontWeight: 600, marginBottom: 'var(--space-xs)' }}>
              {user.firstName} {user.lastName}
            </ViewValue>
            <ViewValue style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>
              {user.email}
            </ViewValue>
            <ViewValue style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              {t('deleteConfirmation.labels.role')} {user.role}
            </ViewValue>
          </div>
        </div>

        <ViewValue style={{ marginTop: 'var(--space-lg)' }}>
          <strong>{t('deleteConfirmation.warning.title')}</strong> {t('deleteConfirmation.warning.deactivatingWill')}
          <ul style={{ marginTop: 'var(--space-sm)', paddingLeft: 'var(--space-lg)' }}>
            <li>{t('deleteConfirmation.warning.blockAccess')}</li>
            <li>{t('deleteConfirmation.warning.preventLogin')}</li>
            <li>{t('deleteConfirmation.warning.keepData')}</li>
            <li>{t('deleteConfirmation.warning.canReactivate')}</li>
          </ul>
        </ViewValue>
      </ViewContent>
    </Modal>
  );
};

export default DeleteConfirmation;
