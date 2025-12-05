import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Order } from '../../types';
import './CancelOrderModal.css';

interface CancelOrderModalProps {
  order: Order;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

const CancelOrderModal: React.FC<CancelOrderModalProps> = ({
  order,
  onClose,
  onConfirm,
  isLoading
}) => {
  const { t } = useTranslation(['orders', 'common']);
  
  return (
    <div className="cancel-order-overlay" onClick={onClose}>
      <div className="cancel-order-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cancel-order-header">
          <h2>{t('cancelOrder')}</h2>
        </div>

        <div className="cancel-order-content">
          <p>{t('view.cancelOrderConfirmation', { 
            defaultValue: 'Are you sure you want to cancel order #{{orderId}} for {{clientName}}?',
            orderId: order.id,
            clientName: order.clientName
          })}</p>
          <p className="warning-text">{t('view.cancelOrderWarning', { 
            defaultValue: 'This will mark the order as cancelled and it cannot be modified.'
          })}</p>
        </div>

        <div className="cancel-order-actions">
          <button
            type="button"
            onClick={onClose}
            className="cancel-button"
            disabled={isLoading}
          >
            {t('view.no', { defaultValue: 'No' })}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="delete-button"
            disabled={isLoading}
          >
            {isLoading ? t('view.cancelling', { defaultValue: 'Cancelling...' }) : t('view.yesCancelOrder', { defaultValue: 'Yes, Cancel Order' })}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelOrderModal;
