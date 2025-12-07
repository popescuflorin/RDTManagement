import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Order } from '../../types';
import { OrderStatus } from '../../types';
import { Package, UserCircle, Truck, FileText, MapPin, Phone, Mail } from 'lucide-react';
import { Modal, ViewContent, ViewSection, ViewGrid, ViewItem, ViewLabel, ViewValue } from '../atoms';

interface ViewOrderProps {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
}

const ViewOrder: React.FC<ViewOrderProps> = ({ isOpen, order, onClose }) => {
  const { t } = useTranslation(['orders', 'common']);

  if (!order) return null;
  
  const getStatusInfo = (status: OrderStatus) => {
    const statusConfig = {
      [OrderStatus.Draft]: { label: t('status.draft'), className: 'status-draft', color: '#6b7280' },
      [OrderStatus.Pending]: { label: t('status.pending'), className: 'status-pending', color: '#f59e0b' },
      [OrderStatus.Processing]: { label: t('status.processing'), className: 'status-processing', color: '#3b82f6' },
      [OrderStatus.Shipped]: { label: t('status.shipped'), className: 'status-shipped', color: '#8b5cf6' },
      [OrderStatus.Delivered]: { label: t('status.delivered'), className: 'status-delivered', color: '#10b981' },
      [OrderStatus.Cancelled]: { label: t('status.cancelled'), className: 'status-cancelled', color: '#ef4444' }
    };
    return statusConfig[status] || { label: t('status.unknown', { defaultValue: 'Unknown' }), className: 'status-draft', color: '#6b7280' };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'RON'
    }).format(amount);
  };

  const statusInfo = getStatusInfo(order.status);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('orderDetails', { defaultValue: 'Order Details' })}
      titleIcon={Package}
      maxWidth="1000px"
      showCancel={true}
      cancelText={t('common:buttons.close', { defaultValue: 'Close' })}
    >
      <ViewContent>
        {/* Status Badge */}
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <div className={`status-badge ${statusInfo.className}`} style={{ 
            backgroundColor: statusInfo.color + '20', 
            color: statusInfo.color, 
            borderColor: statusInfo.color,
            display: 'inline-block',
            padding: 'var(--space-xs) var(--space-md)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            border: '1px solid'
          }}>
            {statusInfo.label}
          </div>
        </div>
        <ViewSection title={t('view.orderOverview', { defaultValue: 'Order Overview' })} titleIcon={Package}>
          <ViewGrid columns={2}>
            <ViewItem>
              <ViewLabel>{t('table.orderId')}</ViewLabel>
              <ViewValue>#{order.id}</ViewValue>
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
            {order.deliveryDate && (
              <ViewItem>
                <ViewLabel>{t('deliveryDate')}</ViewLabel>
                <ViewValue>{formatDate(order.deliveryDate)}</ViewValue>
              </ViewItem>
            )}
            <ViewItem>
              <ViewLabel>{t('totalValue')}</ViewLabel>
              <ViewValue className="highlighted-value">{formatCurrency(order.totalValue)}</ViewValue>
            </ViewItem>
            <ViewItem>
              <ViewLabel>{t('view.itemsCount', { defaultValue: 'Items Count' })}</ViewLabel>
              <ViewValue>{order.orderMaterials.length} {t('items', { defaultValue: 'item(s)' })}</ViewValue>
            </ViewItem>
            {order.description && (
              <ViewItem fullWidth>
                <ViewLabel>{t('common:labels.description')}</ViewLabel>
                <ViewValue>{order.description}</ViewValue>
              </ViewItem>
            )}
            {order.notes && (
              <ViewItem fullWidth>
                <ViewLabel>{t('common:labels.notes')}</ViewLabel>
                <ViewValue>{order.notes}</ViewValue>
              </ViewItem>
            )}
          </ViewGrid>
        </ViewSection>

        <ViewSection title={t('view.clientInformation', { defaultValue: 'Client Information' })} titleIcon={UserCircle}>
          <ViewGrid columns={2}>
            <ViewItem>
              <ViewLabel>{t('table.clientName')}</ViewLabel>
              <ViewValue>{order.clientName}</ViewValue>
            </ViewItem>
            {order.clientContactPerson && (
              <ViewItem>
                <ViewLabel>{t('form.contactPerson')}</ViewLabel>
                <ViewValue>{order.clientContactPerson}</ViewValue>
              </ViewItem>
            )}
            {order.clientEmail && (
              <ViewItem>
                <ViewLabel icon={Mail}>{t('common:labels.email')}</ViewLabel>
                <ViewValue>{order.clientEmail}</ViewValue>
              </ViewItem>
            )}
            {order.clientPhone && (
              <ViewItem>
                <ViewLabel icon={Phone}>{t('common:labels.phone')}</ViewLabel>
                <ViewValue>{order.clientPhone}</ViewValue>
              </ViewItem>
            )}
            {order.clientAddress && (
              <ViewItem fullWidth>
                <ViewLabel icon={MapPin}>{t('common:labels.address')}</ViewLabel>
                <ViewValue>{order.clientAddress}</ViewValue>
              </ViewItem>
            )}
            {order.clientCity && (
              <ViewItem>
                <ViewLabel>{t('common:labels.city')}</ViewLabel>
                <ViewValue>{order.clientCity}</ViewValue>
              </ViewItem>
            )}
            {order.clientPostalCode && (
              <ViewItem>
                <ViewLabel>{t('common:labels.postalCode')}</ViewLabel>
                <ViewValue>{order.clientPostalCode}</ViewValue>
              </ViewItem>
            )}
            {order.clientCountry && (
              <ViewItem>
                <ViewLabel>{t('common:labels.country')}</ViewLabel>
                <ViewValue>{order.clientCountry}</ViewValue>
              </ViewItem>
            )}
          </ViewGrid>
        </ViewSection>

        {order.transportCarName && (
          <ViewSection title={t('form.transportDetails')} titleIcon={Truck}>
            <ViewGrid columns={2}>
              <ViewItem>
                <ViewLabel>{t('view.vehicleName', { defaultValue: 'Vehicle Name' })}</ViewLabel>
                <ViewValue>{order.transportCarName}</ViewValue>
              </ViewItem>
              {order.transportNumberPlate && (
                <ViewItem>
                  <ViewLabel>{t('form.numberPlate')}</ViewLabel>
                  <ViewValue>{order.transportNumberPlate}</ViewValue>
                </ViewItem>
              )}
              {order.transportPhoneNumber && (
                <ViewItem>
                  <ViewLabel>{t('form.phoneNumber')}</ViewLabel>
                  <ViewValue>{order.transportPhoneNumber}</ViewValue>
                </ViewItem>
              )}
              {order.transportDate && (
                <ViewItem>
                  <ViewLabel>{t('form.transportDate')}</ViewLabel>
                  <ViewValue>{formatDate(order.transportDate)}</ViewValue>
                </ViewItem>
              )}
              {order.transportNotes && (
                <ViewItem fullWidth>
                  <ViewLabel>{t('form.transportNotes')}</ViewLabel>
                  <ViewValue>{order.transportNotes}</ViewValue>
                </ViewItem>
              )}
            </ViewGrid>
          </ViewSection>
        )}

        <ViewSection title={t('view.orderItems', { defaultValue: 'Order Items' })} titleIcon={Package}>
          {order.orderMaterials.length === 0 ? (
            <div style={{ padding: 'var(--space-lg)', textAlign: 'center', color: 'var(--text-secondary)' }}>
              {t('view.noItems', { defaultValue: 'No items in this order.' })}
            </div>
          ) : (
            <div className="items-table-container" style={{ overflowX: 'auto' }}>
              <table className="items-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ padding: 'var(--space-sm)', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>{t('form.product')}</th>
                    <th style={{ padding: 'var(--space-sm)', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>{t('form.color')}</th>
                    <th style={{ padding: 'var(--space-sm)', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>{t('form.itemQuantity')}</th>
                    <th style={{ padding: 'var(--space-sm)', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>{t('form.unitPrice')}</th>
                    <th style={{ padding: 'var(--space-sm)', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>{t('form.totalPrice')}</th>
                  </tr>
                </thead>
                <tbody>
                  {order.orderMaterials.map((item, index) => (
                    <tr key={index}>
                      <td style={{ padding: 'var(--space-sm)', borderBottom: '1px solid var(--border)' }}>{item.materialName}</td>
                      <td style={{ padding: 'var(--space-sm)', borderBottom: '1px solid var(--border)' }}>{item.materialColor}</td>
                      <td style={{ padding: 'var(--space-sm)', borderBottom: '1px solid var(--border)' }}>{item.quantity} {item.quantityType}</td>
                      <td style={{ padding: 'var(--space-sm)', borderBottom: '1px solid var(--border)' }}>{formatCurrency(item.unitPrice)}</td>
                      <td style={{ padding: 'var(--space-sm)', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>{formatCurrency(item.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} style={{ padding: 'var(--space-sm)', textAlign: 'right', fontWeight: 600, borderTop: '2px solid var(--border)' }}>
                      {t('view.totalOrderValue', { defaultValue: 'Total Order Value' })}:
                    </td>
                    <td style={{ padding: 'var(--space-sm)', fontWeight: 700, color: 'var(--primary-600)', borderTop: '2px solid var(--border)' }}>
                      {formatCurrency(order.totalValue)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </ViewSection>

        <ViewSection title={t('view.additionalInformation', { defaultValue: 'Additional Information' })} titleIcon={FileText}>
          <ViewGrid columns={2}>
            <ViewItem>
              <ViewLabel>{t('common:labels.createdBy')}</ViewLabel>
              <ViewValue>{order.createdByUserName}</ViewValue>
            </ViewItem>
            <ViewItem>
              <ViewLabel>{t('common:labels.createdAt')}</ViewLabel>
              <ViewValue>{formatDateTime(order.createdAt)}</ViewValue>
            </ViewItem>
            {order.updatedAt && (
              <ViewItem>
                <ViewLabel>{t('view.lastUpdated', { defaultValue: 'Last Updated' })}</ViewLabel>
                <ViewValue>{formatDateTime(order.updatedAt)}</ViewValue>
              </ViewItem>
            )}
          </ViewGrid>
        </ViewSection>
      </ViewContent>
    </Modal>
  );
};

export default ViewOrder;

