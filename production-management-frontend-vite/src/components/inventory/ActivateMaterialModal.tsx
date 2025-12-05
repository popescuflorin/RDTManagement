import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { inventoryApi } from '../../services/api';
import type { RawMaterial } from '../../types';
import { MaterialType } from '../../types';
import './ActivateMaterialModal.css';

interface ActivateMaterialModalProps {
  material: RawMaterial;
  onClose: () => void;
  onMaterialActivated: (materialId: number) => void;
}

const ActivateMaterialModal: React.FC<ActivateMaterialModalProps> = ({ 
  material, 
  onClose, 
  onMaterialActivated 
}) => {
  const { t } = useTranslation(['inventory', 'common']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleActivate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Update material to set isActive = true
      await inventoryApi.updateMaterial(material.id, {
        ...material,
        isActive: true
      });
      onMaterialActivated(material.id);
      onClose();
    } catch (error: any) {
      console.error('Error activating material:', error);
      const errorMessage = error.response?.data?.message || t('activate.messages.failedToActivate');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="activate-material-overlay">
      <div className="activate-material-modal">
        <div className="activate-material-header">
          <h2>✅ {t('activate.title')}</h2>
          <button className="btn btn-sm btn-secondary" onClick={onClose}>×</button>
        </div>

        <div className="activate-material-content">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <p className="confirmation-text">
            {t('activate.confirmationText')}
          </p>

          <div className="material-summary">
            <h3>{t('activate.materialDetails')}</h3>
            <div className="summary-details">
              <div className="summary-item">
                <span className="label">{t('activate.labels.name')}</span>
                <span className="value">{material.name} ({material.color})</span>
              </div>
              <div className="summary-item">
                <span className="label">{t('activate.labels.type')}</span>
                <span className="value">
                  {material.type === MaterialType.RawMaterial 
                    ? t('filters.rawMaterials')
                    : material.type === MaterialType.RecyclableMaterial
                    ? t('filters.recyclableMaterials')
                    : t('filters.finishedProducts')}
                </span>
              </div>
              <div className="summary-item">
                <span className="label">{t('activate.labels.currentStock')}</span>
                <span className="value">
                  {material.quantity.toLocaleString()} {material.quantityType}
                </span>
              </div>
              <div className="summary-item">
                <span className="label">{t('activate.labels.minimumStock')}</span>
                <span className="value">
                  {material.minimumStock.toLocaleString()} {material.quantityType}
                </span>
              </div>
              <div className="summary-item">
                <span className="label">{t('activate.labels.lastUpdated')}</span>
                <span className="value">{formatDate(material.updatedAt)}</span>
              </div>
            </div>
          </div>

          {material.description && (
            <div className="material-description-section">
              <strong>{t('activate.labels.description')}</strong>
              <p>{material.description}</p>
            </div>
          )}

          <div className="info-section">
            <div className="info-icon">ℹ️</div>
            <div className="info-text">
              <strong>{t('common:labels.notes', { defaultValue: 'Note' })}:</strong> {t('activate.note')}
            </div>
          </div>
        </div>

        <div className="activate-material-actions">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            disabled={isLoading}
          >
            {t('activate.buttons.cancel')}
          </button>
          <button
            type="button"
            onClick={handleActivate}
            className="btn btn-success"
            disabled={isLoading}
          >
            {isLoading ? t('activate.buttons.activating') : t('activate.buttons.activateMaterial')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivateMaterialModal;

