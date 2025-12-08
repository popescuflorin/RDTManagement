import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '../atoms';
import type { Acquisition } from '../../types';

interface DeleteAcquisitionProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  acquisition: Acquisition | null;
  isDeleting?: boolean;
}

const DeleteAcquisition: React.FC<DeleteAcquisitionProps> = ({
  isOpen,
  onClose,
  onConfirm,
  acquisition,
  isDeleting = false
}) => {
  const { t } = useTranslation(['acquisitions', 'common']);

  if (!acquisition) return null;

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
      cancelText={t('deleteModal.goBack')}
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
          {t('deleteModal.confirmation', { title: acquisition.title })}
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

export default DeleteAcquisition;
