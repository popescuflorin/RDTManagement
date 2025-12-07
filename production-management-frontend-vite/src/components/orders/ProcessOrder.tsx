import React, { useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import type { Order } from '../../types';
import { Package, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { orderApi } from '../../services/api';
import { Modal, ViewContent, ViewSection, ViewGrid, ViewItem, ViewLabel, ViewValue } from '../atoms';

interface ProcessOrderProps {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
  onSuccess: () => void;
}

const ProcessOrder: React.FC<ProcessOrderProps> = ({
  isOpen,
  order,
  onClose,
  onSuccess
}) => {
  const { t } = useTranslation(['orders', 'common']);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!order) return null;

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('processOrder', { defaultValue: 'Process Order' })}
      titleIcon={Package}
      submitText={isProcessing ? (
        <>
          <Loader2 size={16} className="animate-spin" style={{ display: 'inline-block', marginRight: '8px' }} />
          {t('view.processing', { defaultValue: 'Processing...' })}
        </>
      ) : (
        <>
          <CheckCircle size={16} style={{ display: 'inline-block', marginRight: '8px' }} />
          {t('processOrder', { defaultValue: 'Process Order' })}
        </>
      )}
      cancelText={t('common:buttons.cancel', { defaultValue: 'Cancel' })}
      submitVariant="success"
      isSubmitting={isProcessing}
      onSubmit={handleProcessOrder}
      maxWidth="800px"
      showCancel={true}
    >
      <ViewContent>
        {error && (
          <div className="error-message" style={{ marginBottom: 'var(--space-lg)' }}>
            <AlertTriangle size={16} style={{ display: 'inline-block', marginRight: '8px', verticalAlign: 'middle' }} />
            {error}
          </div>
        )}

        <div className="process-warning" style={{ 
          padding: 'var(--space-md)', 
          backgroundColor: 'var(--warning-50)', 
          border: '1px solid var(--warning-200)', 
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--space-lg)',
          display: 'flex',
          gap: 'var(--space-sm)',
          alignItems: 'flex-start'
        }}>
          <AlertTriangle size={20} style={{ color: 'var(--warning-600)', flexShrink: 0, marginTop: '2px' }} />
          <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-primary)', lineHeight: 'var(--line-height-relaxed)' }}>
            <Trans
              i18nKey="view.processOrderWarning"
              ns="orders"
              values={{ count: order.orderMaterials.length }}
              components={{ strong: <strong /> }}
            />
          </p>
        </div>

        <ViewSection title={t('view.orderInformation', { defaultValue: 'Order Information' })} titleIcon={Package}>
          <ViewGrid columns={2}>
            <ViewItem>
              <ViewLabel>{t('table.orderId')}</ViewLabel>
              <ViewValue>#{order.id}</ViewValue>
            </ViewItem>
            <ViewItem>
              <ViewLabel>{t('client')}</ViewLabel>
              <ViewValue>{order.clientName}</ViewValue>
            </ViewItem>
            <ViewItem>
              <ViewLabel>{t('orderDate')}</ViewLabel>
              <ViewValue>{formatDate(order.orderDate)}</ViewValue>
            </ViewItem>
            {order.expectedDeliveryDate && (
              <ViewItem>
                <ViewLabel>{t('expectedDeliveryDate')}</ViewLabel>
                <ViewValue>{formatDate(order.expectedDeliveryDate)}</ViewValue>
              </ViewItem>
            )}
            <ViewItem>
              <ViewLabel>{t('totalValue')}</ViewLabel>
              <ViewValue>{formatCurrency(order.totalValue)}</ViewValue>
            </ViewItem>
            <ViewItem>
              <ViewLabel>{t('items')}</ViewLabel>
              <ViewValue>{order.orderMaterials.length} {t('view.products', { defaultValue: 'product(s)' })}</ViewValue>
            </ViewItem>
          </ViewGrid>
        </ViewSection>

        <ViewSection title={t('view.productsToSubtract', { defaultValue: 'Products to Subtract from Inventory' })} titleIcon={Package}>
          <div className="products-list" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {order.orderMaterials.map((item, index) => (
              <div key={item.id || index} className="product-item" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 'var(--space-md)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--surface)'
              }}>
                <div className="product-info">
                  <div className="product-name" style={{ fontWeight: 600, marginBottom: '4px' }}>{item.materialName}</div>
                  <div className="product-details" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                    <span>{t('form.color')}: {item.materialColor}</span>
                    <span> • </span>
                    <span>{item.quantity} {item.quantityType}</span>
                  </div>
                </div>
                <div className="product-price" style={{ fontWeight: 600, color: 'var(--primary-600)' }}>
                  {formatCurrency(item.totalPrice)}
                </div>
              </div>
            ))}
          </div>
        </ViewSection>
      </ViewContent>
    </Modal>
  );
};

export default ProcessOrder;
