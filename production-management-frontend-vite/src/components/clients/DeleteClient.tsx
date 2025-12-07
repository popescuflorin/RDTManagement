import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '../atoms';
import type { Client } from '../../types';

interface DeleteClientProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  client: Client | null;
  isDeleting?: boolean;
}

const DeleteClient: React.FC<DeleteClientProps> = ({
  isOpen,
  onClose,
  onConfirm,
  client,
  isDeleting = false
}) => {
  const { t } = useTranslation(['clients', 'common']);

  if (!client) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('deleteModal.title')}
      titleIcon={AlertTriangle}
      maxWidth="500px"
      closeOnBackdropClick={false}
      onSubmit={onConfirm}
      submitText={t('deleteModal.confirm')}
      cancelText={t('deleteModal.cancel')}
      submitVariant="danger"
      isSubmitting={isDeleting}
      showCancel={true}
    >
      <div style={{ padding: 'var(--space-md) 0' }}>
        <p style={{ 
          marginBottom: 'var(--space-lg)', 
          fontSize: 'var(--text-base)',
          color: 'var(--text-primary)',
          lineHeight: 'var(--line-height-relaxed)'
        }}>
          {t('deleteModal.confirmation', { name: client.name })}
        </p>
        <p style={{ 
          margin: 0,
          fontSize: 'var(--text-sm)',
          color: 'var(--text-secondary)',
          lineHeight: 'var(--line-height-relaxed)'
        }}>
          {t('deleteModal.warning')}
        </p>
      </div>
    </Modal>
  );
};

export default DeleteClient;
