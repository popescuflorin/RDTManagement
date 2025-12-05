import React from 'react';
import { useTranslation } from 'react-i18next';
import type { RawMaterial } from '../../types';
import { MaterialType } from '../../types';
import './ViewMaterial.css';

interface ViewMaterialProps {
  material: RawMaterial;
  onClose: () => void;
}

const ViewMaterial: React.FC<ViewMaterialProps> = ({ material, onClose }) => {
  const { t } = useTranslation(['inventory', 'common']);
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
          <h2>👁️ {t('view.title')}</h2>
          <button className="btn btn-sm btn-secondary" onClick={onClose}>×</button>
        </div>

        <div className="view-material-content">
          <div className="material-summary">
            <h3>{t('view.materialInformation')}</h3>
            <div className="summary-details">
              <div className="summary-item">
                <span className="label">{t('form.labels.name')}</span>
                <span className="value">{material.name} ({material.color})</span>
              </div>
              <div className="summary-item">
                <span className="label">{t('form.labels.type')}</span>
                <span className="value">
                  {material.type === MaterialType.RawMaterial 
                    ? t('filters.rawMaterials')
                    : material.type === MaterialType.RecyclableMaterial 
                    ? t('filters.recyclableMaterials')
                    : t('filters.finishedProducts')}
                </span>
              </div>
              <div className="summary-item">
                <span className="label">{t('table.status')}</span>
                <span className={`status-badge ${material.isActive ? 'status-active' : 'status-inactive'}`}>
                  {material.isActive ? t('status.active') : t('status.inactive')}
                </span>
              </div>
              <div className="summary-item">
                <span className="label">{t('table.lastUpdated')}</span>
                <span className="value">{formatDate(material.updatedAt)}</span>
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{t('view.fields.materialName')}</label>
              <div className="read-only-field">{material.name}</div>
            </div>
            <div className="form-group">
              <label>{t('view.fields.color')}</label>
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
              <label>{t('view.fields.materialType')}</label>
              <div className="read-only-field">
                {material.type === MaterialType.RawMaterial 
                  ? t('filters.rawMaterials')
                  : material.type === MaterialType.RecyclableMaterial 
                  ? t('filters.recyclableMaterials')
                  : t('filters.finishedProducts')}
              </div>
            </div>
            <div className="form-group">
              <label>{t('view.fields.unitType')}</label>
              <div className="read-only-field">{material.quantityType}</div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{t('view.fields.currentQuantity')}</label>
              <div className="read-only-field quantity-field">
                {material.quantity.toLocaleString()} {material.quantityType}
              </div>
            </div>
            <div className="form-group">
              <label>{t('view.fields.minimumStockLevel')}</label>
              <div className="read-only-field">
                {material.minimumStock.toLocaleString()} {material.quantityType}
              </div>
            </div>
          </div>

          {material.description && (
            <div className="form-group">
              <label>{t('view.fields.description')}</label>
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
                  ? t('view.stockIndicators.lowStockWarning', { quantity: material.quantity, minimum: material.minimumStock })
                  : t('view.stockIndicators.stockLevelOk', { quantity: material.quantity, minimum: material.minimumStock })
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
            {t('view.buttons.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewMaterial;

