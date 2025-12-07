import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '../atoms';
import type { Order } from '../../types';
import './CancelOrderModal.css';

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
      <div style={{ padding: 'var(--space-md) 0' }}>
        <p style={{ 
          marginBottom: 'var(--space-lg)', 
          fontSize: 'var(--text-base)',
          color: 'var(--text-primary)',
          lineHeight: 'var(--line-height-relaxed)'
        }}>
          {t('view.cancelOrderConfirmation', { 
            defaultValue: 'Are you sure you want to cancel order #{{orderId}} for {{clientName}}?',
            orderId: order.id,
            clientName: order.clientName
          })}
        </p>
        <p style={{ 
          margin: 0,
          fontSize: 'var(--text-sm)',
          color: 'var(--text-secondary)',
          lineHeight: 'var(--line-height-relaxed)'
        }}>
          {t('view.cancelOrderWarning', { 
            defaultValue: 'This will mark the order as cancelled and it cannot be modified.'
          })}
        </p>
      </div>
    </Modal>
  );
};

export default CancelOrderModal;
