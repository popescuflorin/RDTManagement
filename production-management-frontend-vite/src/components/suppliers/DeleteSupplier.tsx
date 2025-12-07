import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '../atoms';
import type { Supplier } from '../../types';

interface DeleteSupplierProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  supplier: Supplier | null;
  isDeleting?: boolean;
}

const DeleteSupplier: React.FC<DeleteSupplierProps> = ({
  isOpen,
  onClose,
  onConfirm,
  supplier,
  isDeleting = false
}) => {
  const { t } = useTranslation(['suppliers', 'common']);

  if (!supplier) return null;

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
          {t('deleteModal.confirmation', { name: supplier.name })}
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

export default DeleteSupplier;
