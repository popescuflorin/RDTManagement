import React, { useState } from 'react';
import type { Order } from '../../types';
import { OrderStatus } from '../../types';
import { X, Package, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { orderApi } from '../../services/api';
import './ProcessOrder.css';

interface ProcessOrderProps {
  order: Order;
  onClose: () => void;
  onSuccess: () => void;
}

const ProcessOrder: React.FC<ProcessOrderProps> = ({
  order,
  onClose,
  onSuccess
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleProcessOrder = async () => {
    if (!order) return;

    setIsProcessing(true);
    setError(null);

    try {
      await orderApi.processOrder(order.id);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to process order');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="process-order-overlay" onClick={handleBackdropClick}>
      <div className="process-order-modal" onClick={(e) => e.stopPropagation()}>
        <div className="process-order-header">
          <div className="header-content">
            <div className="header-title">
              <Package className="header-icon" />
              <h2>Process Order</h2>
            </div>
            <button className="close-button" onClick={onClose} disabled={isProcessing}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="process-order-content">
          {error && (
            <div className="error-message">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          <div className="process-warning">
            <AlertTriangle size={20} className="warning-icon" />
            <p>
              Processing this order will subtract {order.orderMaterials.length} product(s) from inventory 
              and change the order status to <strong>Processing</strong>.
            </p>
          </div>

          {/* Order Details */}
          <div className="order-details-section">
            <div className="section-header">
              <Package className="section-icon" />
              <h3>Order Information</h3>
            </div>
            
            <div className="detail-grid">
              <div className="detail-item">
                <label>Order ID</label>
                <div className="detail-value">#{order.id}</div>
              </div>
              
              <div className="detail-item">
                <label>Client</label>
                <div className="detail-value">{order.clientName}</div>
              </div>

              <div className="detail-item">
                <label>Order Date</label>
                <div className="detail-value">{formatDate(order.orderDate)}</div>
              </div>

              {order.expectedDeliveryDate && (
                <div className="detail-item">
                  <label>Expected Delivery</label>
                  <div className="detail-value">{formatDate(order.expectedDeliveryDate)}</div>
                </div>
              )}

              <div className="detail-item">
                <label>Total Value</label>
                <div className="detail-value">{formatCurrency(order.totalValue)}</div>
              </div>

              <div className="detail-item">
                <label>Items</label>
                <div className="detail-value">{order.orderMaterials.length} product(s)</div>
              </div>
            </div>
          </div>

          {/* Products to be Subtracted */}
          <div className="products-section">
            <div className="section-header">
              <Package className="section-icon" />
              <h3>Products to Subtract from Inventory</h3>
            </div>
            
            <div className="products-list">
              {order.orderMaterials.map((item, index) => (
                <div key={item.id || index} className="product-item">
                  <div className="product-info">
                    <div className="product-name">{item.materialName}</div>
                    <div className="product-details">
                      <span>Color: {item.materialColor}</span>
                      <span>•</span>
                      <span>{item.quantity} {item.quantityType}</span>
                    </div>
                  </div>
                  <div className="product-price">
                    {formatCurrency(item.totalPrice)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="action-buttons">
            <button
              type="button"
              className="cancel-button"
              onClick={onClose}
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              type="button"
              className="process-button"
              onClick={handleProcessOrder}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  Process Order
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessOrder;
