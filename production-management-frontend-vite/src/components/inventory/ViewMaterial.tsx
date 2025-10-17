import React from 'react';
import type { RawMaterial } from '../../types';
import { MaterialType } from '../../types';
import './ViewMaterial.css';

interface ViewMaterialProps {
  material: RawMaterial;
  onClose: () => void;
}

const ViewMaterial: React.FC<ViewMaterialProps> = ({ material, onClose }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="view-material-overlay">
      <div className="view-material-modal">
        <div className="view-material-header">
          <h2>👁️ View Material</h2>
          <button className="btn btn-sm btn-secondary" onClick={onClose}>×</button>
        </div>

        <div className="view-material-content">
          <div className="material-summary">
            <h3>Material Information:</h3>
            <div className="summary-details">
              <div className="summary-item">
                <span className="label">Name:</span>
                <span className="value">{material.name} ({material.color})</span>
              </div>
              <div className="summary-item">
                <span className="label">Type:</span>
                <span className="value">
                  {material.type === MaterialType.RawMaterial 
                    ? 'Raw Material' 
                    : material.type === MaterialType.RecyclableMaterial 
                    ? 'Recyclable Material' 
                    : 'Finished Product'}
                </span>
              </div>
              <div className="summary-item">
                <span className="label">Status:</span>
                <span className={`status-badge ${material.isActive ? 'status-active' : 'status-inactive'}`}>
                  {material.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="summary-item">
                <span className="label">Last Updated:</span>
                <span className="value">{formatDate(material.updatedAt)}</span>
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Material Name</label>
              <div className="read-only-field">{material.name}</div>
            </div>
            <div className="form-group">
              <label>Color</label>
              <div className="read-only-field">
                <span 
                  className="color-dot" 
                  style={{ backgroundColor: material.color.toLowerCase() }}
                ></span>
                {material.color}
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Material Type</label>
              <div className="read-only-field">
                {material.type === MaterialType.RawMaterial 
                  ? 'Raw Material' 
                  : material.type === MaterialType.RecyclableMaterial 
                  ? 'Recyclable Material' 
                  : 'Finished Product'}
              </div>
            </div>
            <div className="form-group">
              <label>Unit Type</label>
              <div className="read-only-field">{material.quantityType}</div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Current Quantity</label>
              <div className="read-only-field quantity-field">
                {material.quantity.toLocaleString()} {material.quantityType}
              </div>
            </div>
            <div className="form-group">
              <label>Minimum Stock Level</label>
              <div className="read-only-field">
                {material.minimumStock.toLocaleString()} {material.quantityType}
              </div>
            </div>
          </div>

          {material.description && (
            <div className="form-group">
              <label>Description</label>
              <div className="read-only-field description-field">
                {material.description}
              </div>
            </div>
          )}

          {/* Stock Status Indicators */}
          <div className="stock-indicators">
            <div className={`stock-indicator ${material.isLowStock ? 'warning' : 'good'}`}>
              <div className="indicator-icon">
                {material.isLowStock ? '⚠️' : '✅'}
              </div>
              <div className="indicator-text">
                {material.isLowStock 
                  ? `Low Stock Warning! (${material.quantity} ≤ ${material.minimumStock})`
                  : `Stock Level OK (${material.quantity} > ${material.minimumStock})`
                }
              </div>
            </div>
          </div>
        </div>

        <div className="view-material-actions">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-primary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewMaterial;

