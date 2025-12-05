import React from 'react';
import type { Client } from '../../types';
import { X, UserCircle, Mail, Phone, MapPin, Calendar, User } from 'lucide-react';
import './CreateClient.css';

interface ViewClientProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
}

const ViewClient: React.FC<ViewClientProps> = ({
  isOpen,
  onClose,
  client
}) => {
  const handleBackdropClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content create-client-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <UserCircle size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Client Details
          </h2>
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="client-view-content">
          <div className="view-section">
            <h3>Basic Information</h3>
            <div className="view-grid">
              <div className="view-item">
                <label>Name</label>
                <div className="view-value">{client.name}</div>
              </div>
              {client.contactPerson && (
                <div className="view-item">
                  <label>Contact Person</label>
                  <div className="view-value">{client.contactPerson}</div>
                </div>
              )}
              <div className="view-item">
                <label>Status</label>
                <div className="view-value">
                  <span className={`status-badge ${client.isActive ? 'status-active' : 'status-inactive'}`}>
                    {client.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="view-section">
            <h3>Contact Information</h3>
            <div className="view-grid">
              {client.email && (
                <div className="view-item">
                  <label><Mail size={14} style={{ display: 'inline', marginRight: '4px' }} />Email</label>
                  <div className="view-value">{client.email}</div>
                </div>
              )}
              {client.phone && (
                <div className="view-item">
                  <label><Phone size={14} style={{ display: 'inline', marginRight: '4px' }} />Phone</label>
                  <div className="view-value">{client.phone}</div>
                </div>
              )}
            </div>
          </div>

          <div className="view-section">
            <h3>Address</h3>
            <div className="view-grid">
              {client.address && (
                <div className="view-item full-width">
                  <label>Street Address</label>
                  <div className="view-value">{client.address}</div>
                </div>
              )}
              {client.city && (
                <div className="view-item">
                  <label>City</label>
                  <div className="view-value">{client.city}</div>
                </div>
              )}
              {client.postalCode && (
                <div className="view-item">
                  <label>Postal Code</label>
                  <div className="view-value">{client.postalCode}</div>
                </div>
              )}
              {client.country && (
                <div className="view-item">
                  <label><MapPin size={14} style={{ display: 'inline', marginRight: '4px' }} />Country</label>
                  <div className="view-value">{client.country}</div>
                </div>
              )}
            </div>
          </div>

          <div className="view-section">
            <h3>Statistics</h3>
            <div className="view-grid">
              <div className="view-item">
                <label>Total Orders</label>
                <div className="view-value">{client.totalOrders}</div>
              </div>
              <div className="view-item">
                <label>Total Order Value</label>
                <div className="view-value">{formatCurrency(client.totalOrderValue)}</div>
              </div>
              {client.lastOrderDate && (
                <div className="view-item">
                  <label>Last Order Date</label>
                  <div className="view-value">{formatDate(client.lastOrderDate)}</div>
                </div>
              )}
            </div>
          </div>

          {client.notes && (
            <div className="view-section">
              <h3>Notes</h3>
              <div className="view-item full-width">
                <div className="view-value">{client.notes}</div>
              </div>
            </div>
          )}

          <div className="view-section">
            <h3>Metadata</h3>
            <div className="view-grid">
              <div className="view-item">
                <label><User size={14} style={{ display: 'inline', marginRight: '4px' }} />Created By</label>
                <div className="view-value">{client.createdByUserName}</div>
              </div>
              <div className="view-item">
                <label><Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} />Created At</label>
                <div className="view-value">{formatDate(client.createdAt)}</div>
              </div>
              {client.updatedAt && (
                <div className="view-item">
                  <label><Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} />Updated At</label>
                  <div className="view-value">{formatDate(client.updatedAt)}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="cancel-button"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewClient;

