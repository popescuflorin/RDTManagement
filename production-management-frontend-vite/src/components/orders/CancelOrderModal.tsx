import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { Modal, ViewContent, ViewValue } from '../atoms';
import type { Order } from '../../types';

interface CancelOrderModalProps {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

const CancelOrderModal: React.FC<CancelOrderModalProps> = ({
  isOpen,
  order,
  onClose,
  onConfirm,
  isLoading
}) => {
  const { t } = useTranslation(['orders', 'common']);

  if (!order) return null;
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('cancelOrder', { defaultValue: 'Cancel Order' })}
      titleIcon={AlertTriangle}
      maxWidth="500px"
      closeOnBackdropClick={false}
      onSubmit={onConfirm}
      submitText={isLoading ? t('view.cancelling', { defaultValue: 'Cancelling...' }) : t('view.yesCancelOrder', { defaultValue: 'Yes, Cancel Order' })}
      cancelText={t('view.no', { defaultValue: 'No' })}
      submitVariant="danger"
      isSubmitting={isLoading}
      showCancel={true}
    >
      <ViewContent>
        <ViewValue style={{ marginBottom: 'var(--space-lg)', fontSize: 'var(--text-base)' }}>
          {t('view.cancelOrderConfirmation', { 
            defaultValue: 'Are you sure you want to cancel order #{{orderId}} for {{clientName}}?',
            orderId: order.id,
            clientName: order.clientName
          })}
        </ViewValue>
        <ViewValue style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
          {t('view.cancelOrderWarning', { 
            defaultValue: 'This will mark the order as cancelled and it cannot be modified.'
          })}
        </ViewValue>
      </ViewContent>
    </Modal>
  );
};

export default CancelOrderModal;
