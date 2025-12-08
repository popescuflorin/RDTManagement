import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { Modal, ViewContent, ViewValue } from '../atoms';
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
      <ViewContent>
        <ViewValue style={{ marginBottom: 'var(--space-lg)', fontSize: 'var(--text-base)' }}>
          {t('deleteModal.confirmation', { name: supplier.name })}
        </ViewValue>
        <ViewValue style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
          {t('deleteModal.warning')}
        </ViewValue>
      </ViewContent>
    </Modal>
  );
};

export default DeleteSupplier;
