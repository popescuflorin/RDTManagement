import React, { useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import type { Order } from '../../types';
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
  const { t } = useTranslation(['orders', 'common']);
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
      currency: 'RON'
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
      setError(err.response?.data?.message || t('messages.failedToProcessOrder', { defaultValue: 'Failed to process order' }));
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
              <h2>{t('processOrder')}</h2>
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
              <Trans
                i18nKey="view.processOrderWarning"
                ns="orders"
                values={{ count: order.orderMaterials.length }}
                components={{ strong: <strong /> }}
              />
            </p>
          </div>

          {/* Order Details */}
          <div className="order-details-section">
            <div className="section-header">
              <Package className="section-icon" />
              <h3>{t('view.orderInformation', { defaultValue: 'Order Information' })}</h3>
            </div>
            
            <div className="detail-grid">
              <div className="detail-item">
                <label>{t('table.orderId')}</label>
                <div className="detail-value">#{order.id}</div>
              </div>
              
              <div className="detail-item">
                <label>{t('client')}</label>
                <div className="detail-value">{order.clientName}</div>
              </div>

              <div className="detail-item">
                <label>{t('orderDate')}</label>
                <div className="detail-value">{formatDate(order.orderDate)}</div>
              </div>

              {order.expectedDeliveryDate && (
                <div className="detail-item">
                  <label>{t('expectedDeliveryDate')}</label>
                  <div className="detail-value">{formatDate(order.expectedDeliveryDate)}</div>
                </div>
              )}

              <div className="detail-item">
                <label>{t('totalValue')}</label>
                <div className="detail-value">{formatCurrency(order.totalValue)}</div>
              </div>

              <div className="detail-item">
                <label>{t('items')}</label>
                <div className="detail-value">{order.orderMaterials.length} {t('view.products', { defaultValue: 'product(s)' })}</div>
              </div>
            </div>
          </div>

          {/* Products to be Subtracted */}
          <div className="products-section">
            <div className="section-header">
              <Package className="section-icon" />
              <h3>{t('view.productsToSubtract', { defaultValue: 'Products to Subtract from Inventory' })}</h3>
            </div>
            
            <div className="products-list">
              {order.orderMaterials.map((item, index) => (
                <div key={item.id || index} className="product-item">
                  <div className="product-info">
                    <div className="product-name">{item.materialName}</div>
                    <div className="product-details">
                      <span>{t('form.color')}: {item.materialColor}</span>
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
              {t('common:buttons.cancel')}
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
                  {t('view.processing', { defaultValue: 'Processing...' })}
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  {t('processOrder')}
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
