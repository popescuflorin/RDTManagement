import React from 'react';
import type { Order } from '../../types';
import { OrderStatus } from '../../types';
import { X, Package, UserCircle, Truck, FileText, MapPin, Phone, Mail } from 'lucide-react';
import './ViewOrder.css';

interface ViewOrderProps {
  order: Order;
  onClose: () => void;
}

const ViewOrder: React.FC<ViewOrderProps> = ({ order, onClose }) => {
  const getStatusInfo = (status: OrderStatus) => {
    const statusConfig = {
      [OrderStatus.Draft]: { label: 'Draft', className: 'status-draft', color: '#6b7280' },
      [OrderStatus.Pending]: { label: 'Pending', className: 'status-pending', color: '#f59e0b' },
      [OrderStatus.Processing]: { label: 'Processing', className: 'status-processing', color: '#3b82f6' },
      [OrderStatus.Shipped]: { label: 'Shipped', className: 'status-shipped', color: '#8b5cf6' },
      [OrderStatus.Delivered]: { label: 'Delivered', className: 'status-delivered', color: '#10b981' },
      [OrderStatus.Cancelled]: { label: 'Cancelled', className: 'status-cancelled', color: '#ef4444' }
    };
    return statusConfig[status] || { label: 'Unknown', className: 'status-draft', color: '#6b7280' };
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
      currency: 'USD'
    }).format(amount);
  };

  const statusInfo = getStatusInfo(order.status);

  return (
    <div className="view-order-overlay" onClick={onClose}>
      <div className="view-order-modal" onClick={(e) => e.stopPropagation()}>
        <div className="view-order-header">
          <div className="header-content">
            <div className="header-title">
              <Package className="header-icon" />
              <h2>Order Details</h2>
            </div>
            <button className="close-button" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
          <div className="header-status">
            <div className={`status-badge ${statusInfo.className}`} style={{ backgroundColor: statusInfo.color + '20', color: statusInfo.color, borderColor: statusInfo.color }}>
              <span>{statusInfo.label}</span>
            </div>
          </div>
        </div>

        <div className="view-order-content">
          {/* Order Overview */}
          <div className="info-section">
            <div className="section-header">
              <Package className="section-icon" />
              <h3>Order Overview</h3>
            </div>
            
            <div className="info-grid">
              <div className="info-item">
                <label>Order ID</label>
                <div className="info-value">#{order.id}</div>
              </div>
              
              <div className="info-item">
                <label>Order Date</label>
                <div className="info-value">{formatDate(order.orderDate)}</div>
              </div>

              {order.expectedDeliveryDate && (
                <div className="info-item">
                  <label>Expected Delivery</label>
                  <div className="info-value">{formatDate(order.expectedDeliveryDate)}</div>
                </div>
              )}

              {order.deliveryDate && (
                <div className="info-item">
                  <label>Delivery Date</label>
                  <div className="info-value">{formatDate(order.deliveryDate)}</div>
                </div>
              )}

              <div className="info-item">
                <label>Total Value</label>
                <div className="info-value info-value-primary">{formatCurrency(order.totalValue)}</div>
              </div>

              <div className="info-item">
                <label>Items Count</label>
                <div className="info-value">{order.orderMaterials.length} item(s)</div>
              </div>

              {order.description && (
                <div className="info-item full-width">
                  <label>Description</label>
                  <div className="info-value">{order.description}</div>
                </div>
              )}

              {order.notes && (
                <div className="info-item full-width">
                  <label>Notes</label>
                  <div className="info-value">{order.notes}</div>
                </div>
              )}
            </div>
          </div>

          {/* Client Information */}
          <div className="info-section">
            <div className="section-header">
              <UserCircle className="section-icon" />
              <h3>Client Information</h3>
            </div>
            
            <div className="info-grid">
              <div className="info-item">
                <label>Client Name</label>
                <div className="info-value">{order.clientName}</div>
              </div>

              {order.clientContactPerson && (
                <div className="info-item">
                  <label>Contact Person</label>
                  <div className="info-value">{order.clientContactPerson}</div>
                </div>
              )}

              {order.clientEmail && (
                <div className="info-item">
                  <label>
                    <Mail size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                    Email
                  </label>
                  <div className="info-value">{order.clientEmail}</div>
                </div>
              )}

              {order.clientPhone && (
                <div className="info-item">
                  <label>
                    <Phone size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                    Phone
                  </label>
                  <div className="info-value">{order.clientPhone}</div>
                </div>
              )}

              {order.clientAddress && (
                <div className="info-item full-width">
                  <label>
                    <MapPin size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                    Address
                  </label>
                  <div className="info-value">{order.clientAddress}</div>
                </div>
              )}

              <div className="info-item">
                {order.clientCity && (
                  <>
                    <label>City</label>
                    <div className="info-value">{order.clientCity}</div>
                  </>
                )}
              </div>

              {order.clientPostalCode && (
                <div className="info-item">
                  <label>Postal Code</label>
                  <div className="info-value">{order.clientPostalCode}</div>
                </div>
              )}

              {order.clientCountry && (
                <div className="info-item">
                  <label>Country</label>
                  <div className="info-value">{order.clientCountry}</div>
                </div>
              )}
            </div>
          </div>

          {/* Transport Information */}
          {order.transportCarName && (
            <div className="info-section">
              <div className="section-header">
                <Truck className="section-icon" />
                <h3>Transport Details</h3>
              </div>
              
              <div className="info-grid">
                <div className="info-item">
                  <label>Vehicle Name</label>
                  <div className="info-value">{order.transportCarName}</div>
                </div>

                {order.transportPhoneNumber && (
                  <div className="info-item">
                    <label>Phone Number</label>
                    <div className="info-value">{order.transportPhoneNumber}</div>
                  </div>
                )}

                {order.transportDate && (
                  <div className="info-item">
                    <label>Transport Date</label>
                    <div className="info-value">{formatDate(order.transportDate)}</div>
                  </div>
                )}

                {order.transportNotes && (
                  <div className="info-item full-width">
                    <label>Transport Notes</label>
                    <div className="info-value">{order.transportNotes}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Order Items */}
          <div className="info-section">
            <div className="section-header">
              <Package className="section-icon" />
              <h3>Order Items</h3>
            </div>
            
            {order.orderMaterials.length === 0 ? (
              <div className="no-items-message">No items in this order.</div>
            ) : (
              <div className="items-table-container">
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Color</th>
                      <th>Quantity</th>
                      <th>Unit Price</th>
                      <th>Total Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.orderMaterials.map((item, index) => (
                      <tr key={index}>
                        <td>{item.materialName}</td>
                        <td>{item.materialColor}</td>
                        <td>{item.quantity} {item.quantityType}</td>
                        <td>{formatCurrency(item.unitPrice)}</td>
                        <td className="currency-cell">{formatCurrency(item.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={4} className="total-label">Total Order Value:</td>
                      <td className="total-value">{formatCurrency(order.totalValue)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Additional Information */}
          <div className="info-section">
            <div className="section-header">
              <FileText className="section-icon" />
              <h3>Additional Information</h3>
            </div>
            
            <div className="info-grid">
              <div className="info-item">
                <label>Created By</label>
                <div className="info-value">{order.createdByUserName}</div>
              </div>

              <div className="info-item">
                <label>Created At</label>
                <div className="info-value">{formatDateTime(order.createdAt)}</div>
              </div>

              {order.updatedAt && (
                <div className="info-item">
                  <label>Last Updated</label>
                  <div className="info-value">{formatDateTime(order.updatedAt)}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="view-order-actions">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewOrder;

