import React from 'react';
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
  return (
    <div className="cancel-order-overlay" onClick={onClose}>
      <div className="cancel-order-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cancel-order-header">
          <h2>Cancel Order</h2>
        </div>

        <div className="cancel-order-content">
          <p>Are you sure you want to cancel order #{order.id} for {order.clientName}?</p>
          <p className="warning-text">This will mark the order as cancelled and it cannot be modified.</p>
        </div>

        <div className="cancel-order-actions">
          <button
            type="button"
            onClick={onClose}
            className="cancel-button"
            disabled={isLoading}
          >
            No
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="delete-button"
            disabled={isLoading}
          >
            {isLoading ? 'Cancelling...' : 'Yes, Cancel Order'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelOrderModal;
