import React from 'react';
import type { Supplier } from '../../types';
import { X, Building2, Mail, Phone, MapPin, FileText, Calendar, User } from 'lucide-react';
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
            Supplier Details
          </h2>
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="supplier-view-content">
          <div className="view-section">
            <h3>Basic Information</h3>
            <div className="view-grid">
              <div className="view-item">
                <label>Name</label>
                <div className="view-value">{supplier.name}</div>
              </div>
              {supplier.description && (
                <div className="view-item full-width">
                  <label>Description</label>
                  <div className="view-value">{supplier.description}</div>
                </div>
              )}
              {supplier.contactPerson && (
                <div className="view-item">
                  <label>Contact Person</label>
                  <div className="view-value">{supplier.contactPerson}</div>
                </div>
              )}
              <div className="view-item">
                <label>Status</label>
                <div className="view-value">
                  <span className={`status-badge ${supplier.isActive ? 'status-active' : 'status-inactive'}`}>
                    {supplier.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="view-section">
            <h3>Contact Information</h3>
            <div className="view-grid">
              {supplier.email && (
                <div className="view-item">
                  <label><Mail size={14} style={{ display: 'inline', marginRight: '4px' }} />Email</label>
                  <div className="view-value">{supplier.email}</div>
                </div>
              )}
              {supplier.phone && (
                <div className="view-item">
                  <label><Phone size={14} style={{ display: 'inline', marginRight: '4px' }} />Phone</label>
                  <div className="view-value">{supplier.phone}</div>
                </div>
              )}
            </div>
          </div>

          <div className="view-section">
            <h3>Address</h3>
            <div className="view-grid">
              {supplier.address && (
                <div className="view-item full-width">
                  <label>Street Address</label>
                  <div className="view-value">{supplier.address}</div>
                </div>
              )}
              {supplier.city && (
                <div className="view-item">
                  <label>City</label>
                  <div className="view-value">{supplier.city}</div>
                </div>
              )}
              {supplier.postalCode && (
                <div className="view-item">
                  <label>Postal Code</label>
                  <div className="view-value">{supplier.postalCode}</div>
                </div>
              )}
              {supplier.country && (
                <div className="view-item">
                  <label><MapPin size={14} style={{ display: 'inline', marginRight: '4px' }} />Country</label>
                  <div className="view-value">{supplier.country}</div>
                </div>
              )}
            </div>
          </div>

          <div className="view-section">
            <h3>Business Information</h3>
            <div className="view-grid">
              {supplier.taxId && (
                <div className="view-item">
                  <label>Tax ID</label>
                  <div className="view-value">{supplier.taxId}</div>
                </div>
              )}
              {supplier.registrationNumber && (
                <div className="view-item">
                  <label>Registration Number</label>
                  <div className="view-value">{supplier.registrationNumber}</div>
                </div>
              )}
            </div>
          </div>

          <div className="view-section">
            <h3>Statistics</h3>
            <div className="view-grid">
              <div className="view-item">
                <label>Total Acquisitions</label>
                <div className="view-value">{supplier.totalAcquisitions}</div>
              </div>
              <div className="view-item">
                <label>Total Acquisition Value</label>
                <div className="view-value">{formatCurrency(supplier.totalAcquisitionValue)}</div>
              </div>
              {supplier.lastAcquisitionDate && (
                <div className="view-item">
                  <label>Last Acquisition Date</label>
                  <div className="view-value">{formatDate(supplier.lastAcquisitionDate)}</div>
                </div>
              )}
            </div>
          </div>

          {supplier.notes && (
            <div className="view-section">
              <h3>Notes</h3>
              <div className="view-item full-width">
                <div className="view-value">{supplier.notes}</div>
              </div>
            </div>
          )}

          <div className="view-section">
            <h3>Metadata</h3>
            <div className="view-grid">
              <div className="view-item">
                <label><User size={14} style={{ display: 'inline', marginRight: '4px' }} />Created By</label>
                <div className="view-value">{supplier.createdByUserName}</div>
              </div>
              <div className="view-item">
                <label><Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} />Created At</label>
                <div className="view-value">{formatDate(supplier.createdAt)}</div>
              </div>
              {supplier.updatedAt && (
                <div className="view-item">
                  <label><Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} />Updated At</label>
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
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewSupplier;

