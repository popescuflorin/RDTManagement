import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { userApi } from '../../services/api';
import type { User } from '../../types';
import { Modal, ViewContent, ViewValue, ErrorMessage } from '../atoms';
import { UserCheck } from 'lucide-react';

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
    <Modal
      isOpen={true}
      onClose={onClose}
      title={t('activateUser.title')}
      titleIcon={UserCheck}
      onSubmit={handleActivate}
      submitText={isLoading ? t('activateUser.buttons.activating') : t('activateUser.buttons.activateUser')}
      cancelText={t('activateUser.buttons.cancel')}
      isSubmitting={isLoading}
    >
      <ViewContent>
        {error && <ErrorMessage message={error} />}

        <ViewValue style={{ marginBottom: 'var(--space-lg)', fontSize: 'var(--text-base)' }}>
          {t('activateUser.confirmation')}
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
              {t('activateUser.labels.role')} {user.role}
            </ViewValue>
          </div>
        </div>

        <ViewValue style={{ marginTop: 'var(--space-lg)' }}>
          <strong>{t('activateUser.info.title')}</strong>
          <ul style={{ marginTop: 'var(--space-sm)', paddingLeft: 'var(--space-lg)' }}>
            <li>{t('activateUser.info.restoreAccess')}</li>
            <li>{t('activateUser.info.allowLogin')}</li>
            <li>{t('activateUser.info.enablePermissions')}</li>
          </ul>
        </ViewValue>
      </ViewContent>
    </Modal>
  );
};

export default ActivateUser;

