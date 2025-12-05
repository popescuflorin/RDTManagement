import React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation(['clients', 'common']);
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
            {t('viewClient.title')}
          </h2>
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="client-view-content">
          <div className="view-section">
            <h3>{t('viewClient.sections.basicInformation')}</h3>
            <div className="view-grid">
              <div className="view-item">
                <label>{t('viewClient.fields.name')}</label>
                <div className="view-value">{client.name}</div>
              </div>
              {client.contactPerson && (
                <div className="view-item">
                  <label>{t('viewClient.fields.contactPerson')}</label>
                  <div className="view-value">{client.contactPerson}</div>
                </div>
              )}
              <div className="view-item">
                <label>{t('viewClient.fields.status')}</label>
                <div className="view-value">
                  <span className={`status-badge ${client.isActive ? 'status-active' : 'status-inactive'}`}>
                    {client.isActive ? t('clients.status.active') : t('clients.status.inactive')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="view-section">
            <h3>{t('viewClient.sections.contactInformation')}</h3>
            <div className="view-grid">
              {client.email && (
                <div className="view-item">
                  <label><Mail size={14} style={{ display: 'inline', marginRight: '4px' }} />{t('viewClient.fields.email')}</label>
                  <div className="view-value">{client.email}</div>
                </div>
              )}
              {client.phone && (
                <div className="view-item">
                  <label><Phone size={14} style={{ display: 'inline', marginRight: '4px' }} />{t('viewClient.fields.phone')}</label>
                  <div className="view-value">{client.phone}</div>
                </div>
              )}
            </div>
          </div>

          <div className="view-section">
            <h3>{t('viewClient.sections.address')}</h3>
            <div className="view-grid">
              {client.address && (
                <div className="view-item full-width">
                  <label>{t('viewClient.fields.streetAddress')}</label>
                  <div className="view-value">{client.address}</div>
                </div>
              )}
              {client.city && (
                <div className="view-item">
                  <label>{t('viewClient.fields.city')}</label>
                  <div className="view-value">{client.city}</div>
                </div>
              )}
              {client.postalCode && (
                <div className="view-item">
                  <label>{t('viewClient.fields.postalCode')}</label>
                  <div className="view-value">{client.postalCode}</div>
                </div>
              )}
              {client.country && (
                <div className="view-item">
                  <label><MapPin size={14} style={{ display: 'inline', marginRight: '4px' }} />{t('viewClient.fields.country')}</label>
                  <div className="view-value">{client.country}</div>
                </div>
              )}
            </div>
          </div>

          <div className="view-section">
            <h3>{t('viewClient.sections.statistics')}</h3>
            <div className="view-grid">
              <div className="view-item">
                <label>{t('viewClient.fields.totalOrders')}</label>
                <div className="view-value">{client.totalOrders}</div>
              </div>
              <div className="view-item">
                <label>{t('viewClient.fields.totalOrderValue')}</label>
                <div className="view-value">{formatCurrency(client.totalOrderValue)}</div>
              </div>
              {client.lastOrderDate && (
                <div className="view-item">
                  <label>{t('viewClient.fields.lastOrderDate')}</label>
                  <div className="view-value">{formatDate(client.lastOrderDate)}</div>
                </div>
              )}
            </div>
          </div>

          {client.notes && (
            <div className="view-section">
              <h3>{t('viewClient.sections.notes')}</h3>
              <div className="view-item full-width">
                <div className="view-value">{client.notes}</div>
              </div>
            </div>
          )}

          <div className="view-section">
            <h3>{t('viewClient.sections.metadata')}</h3>
            <div className="view-grid">
              <div className="view-item">
                <label><User size={14} style={{ display: 'inline', marginRight: '4px' }} />{t('viewClient.fields.createdBy')}</label>
                <div className="view-value">{client.createdByUserName}</div>
              </div>
              <div className="view-item">
                <label><Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} />{t('viewClient.fields.createdAt')}</label>
                <div className="view-value">{formatDate(client.createdAt)}</div>
              </div>
              {client.updatedAt && (
                <div className="view-item">
                  <label><Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} />{t('viewClient.fields.updatedAt')}</label>
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
            {t('viewClient.buttons.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewClient;

