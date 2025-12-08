import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { Modal, ViewValue, ViewContent } from '../atoms';
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
      <ViewContent>
        <ViewValue>{t('deleteModal.confirmation', { name: client.name })}</ViewValue>
        <ViewValue>{t('deleteModal.warning')}</ViewValue>
      </ViewContent>
    </Modal>
  );
};

export default DeleteClient;
