import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { Modal, ViewContent, ViewValue } from '../atoms';
import type { Transport } from '../../types';

interface DeleteTransportProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  transport: Transport | null;
  isDeleting?: boolean;
}

const DeleteTransport: React.FC<DeleteTransportProps> = ({
  isOpen,
  onClose,
  onConfirm,
  transport,
  isDeleting = false
}) => {
  const { t } = useTranslation(['transports', 'common']);

  if (!transport) return null;

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
          {t('deleteModal.confirmation', { carName: transport.carName })}
        </ViewValue>
        <ViewValue style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
          {t('deleteModal.warning')}
        </ViewValue>
      </ViewContent>
    </Modal>
  );
};

export default DeleteTransport;
