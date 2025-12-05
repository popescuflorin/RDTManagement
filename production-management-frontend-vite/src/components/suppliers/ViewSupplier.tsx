import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Supplier } from '../../types';
import { X, Building2, Mail, Phone, MapPin, Calendar, User } from 'lucide-react';
import './CreateSupplier.css';

interface ViewSupplierProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: Supplier;
}

const ViewSupplier: React.FC<ViewSupplierProps> = ({
  isOpen,
  onClose,
  supplier
}) => {
  const { t } = useTranslation(['suppliers', 'common']);
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
      <div className="modal-content create-supplier-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <Building2 size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            {t('viewSupplier.title')}
          </h2>
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="supplier-view-content">
          <div className="view-section">
            <h3>{t('viewSupplier.sections.basicInformation')}</h3>
            <div className="view-grid">
              <div className="view-item">
                <label>{t('viewSupplier.fields.name')}</label>
                <div className="view-value">{supplier.name}</div>
              </div>
              {supplier.description && (
                <div className="view-item full-width">
                  <label>{t('viewSupplier.fields.description')}</label>
                  <div className="view-value">{supplier.description}</div>
                </div>
              )}
              {supplier.contactPerson && (
                <div className="view-item">
                  <label>{t('viewSupplier.fields.contactPerson')}</label>
                  <div className="view-value">{supplier.contactPerson}</div>
                </div>
              )}
              <div className="view-item">
                <label>{t('viewSupplier.fields.status')}</label>
                <div className="view-value">
                  <span className={`status-badge ${supplier.isActive ? 'status-active' : 'status-inactive'}`}>
                    {supplier.isActive ? t('suppliers.status.active') : t('suppliers.status.inactive')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="view-section">
            <h3>{t('viewSupplier.sections.contactInformation')}</h3>
            <div className="view-grid">
              {supplier.email && (
                <div className="view-item">
                  <label><Mail size={14} style={{ display: 'inline', marginRight: '4px' }} />{t('viewSupplier.fields.email')}</label>
                  <div className="view-value">{supplier.email}</div>
                </div>
              )}
              {supplier.phone && (
                <div className="view-item">
                  <label><Phone size={14} style={{ display: 'inline', marginRight: '4px' }} />{t('viewSupplier.fields.phone')}</label>
                  <div className="view-value">{supplier.phone}</div>
                </div>
              )}
            </div>
          </div>

          <div className="view-section">
            <h3>{t('viewSupplier.sections.address')}</h3>
            <div className="view-grid">
              {supplier.address && (
                <div className="view-item full-width">
                  <label>{t('viewSupplier.fields.streetAddress')}</label>
                  <div className="view-value">{supplier.address}</div>
                </div>
              )}
              {supplier.city && (
                <div className="view-item">
                  <label>{t('viewSupplier.fields.city')}</label>
                  <div className="view-value">{supplier.city}</div>
                </div>
              )}
              {supplier.postalCode && (
                <div className="view-item">
                  <label>{t('viewSupplier.fields.postalCode')}</label>
                  <div className="view-value">{supplier.postalCode}</div>
                </div>
              )}
              {supplier.country && (
                <div className="view-item">
                  <label><MapPin size={14} style={{ display: 'inline', marginRight: '4px' }} />{t('viewSupplier.fields.country')}</label>
                  <div className="view-value">{supplier.country}</div>
                </div>
              )}
            </div>
          </div>

          <div className="view-section">
            <h3>{t('viewSupplier.sections.businessInformation')}</h3>
            <div className="view-grid">
              {supplier.taxId && (
                <div className="view-item">
                  <label>{t('viewSupplier.fields.taxId')}</label>
                  <div className="view-value">{supplier.taxId}</div>
                </div>
              )}
              {supplier.registrationNumber && (
                <div className="view-item">
                  <label>{t('viewSupplier.fields.registrationNumber')}</label>
                  <div className="view-value">{supplier.registrationNumber}</div>
                </div>
              )}
            </div>
          </div>

          <div className="view-section">
            <h3>{t('viewSupplier.sections.statistics')}</h3>
            <div className="view-grid">
              <div className="view-item">
                <label>{t('viewSupplier.fields.totalAcquisitions')}</label>
                <div className="view-value">{supplier.totalAcquisitions}</div>
              </div>
              <div className="view-item">
                <label>{t('viewSupplier.fields.totalAcquisitionValue')}</label>
                <div className="view-value">{formatCurrency(supplier.totalAcquisitionValue)}</div>
              </div>
              {supplier.lastAcquisitionDate && (
                <div className="view-item">
                  <label>{t('viewSupplier.fields.lastAcquisitionDate')}</label>
                  <div className="view-value">{formatDate(supplier.lastAcquisitionDate)}</div>
                </div>
              )}
            </div>
          </div>

          {supplier.notes && (
            <div className="view-section">
              <h3>{t('viewSupplier.sections.notes')}</h3>
              <div className="view-item full-width">
                <div className="view-value">{supplier.notes}</div>
              </div>
            </div>
          )}

          <div className="view-section">
            <h3>{t('viewSupplier.sections.metadata')}</h3>
            <div className="view-grid">
              <div className="view-item">
                <label><User size={14} style={{ display: 'inline', marginRight: '4px' }} />{t('viewSupplier.fields.createdBy')}</label>
                <div className="view-value">{supplier.createdByUserName}</div>
              </div>
              <div className="view-item">
                <label><Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} />{t('viewSupplier.fields.createdAt')}</label>
                <div className="view-value">{formatDate(supplier.createdAt)}</div>
              </div>
              {supplier.updatedAt && (
                <div className="view-item">
                  <label><Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} />{t('viewSupplier.fields.updatedAt')}</label>
                  <div className="view-value">{formatDate(supplier.updatedAt)}</div>
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
            {t('viewSupplier.buttons.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewSupplier;

