import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { inventoryApi } from '../../services/api';
import type { RawMaterial } from '../../types';
import { MaterialType } from '../../types';
import './DeleteMaterialConfirmation.css';

interface DeleteMaterialConfirmationProps {
  material: RawMaterial;
  onClose: () => void;
  onMaterialDeleted: (materialId: number) => void;
}

const DeleteMaterialConfirmation: React.FC<DeleteMaterialConfirmationProps> = ({ 
  material, 
  onClose, 
  onMaterialDeleted 
}) => {
  const { t } = useTranslation(['inventory', 'common']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeactivate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Update material to set isActive = false
      await inventoryApi.updateMaterial(material.id, {
        ...material,
        isActive: false
      });
      onMaterialDeleted(material.id);
      onClose();
    } catch (error: any) {
      console.error('Error deactivating material:', error);
      const errorMessage = error.response?.data?.message || t('deactivate.messages.failedToDeactivate');
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
    <div className="delete-material-confirmation-overlay">
      <div className="delete-material-confirmation-modal">
        <div className="delete-material-confirmation-header">
          <h2>⚠️ {t('deactivate.title')}</h2>
          <button className="btn btn-sm btn-secondary" onClick={onClose}>×</button>
        </div>

        <div className="delete-material-confirmation-content">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <p className="confirmation-text">
            {t('deactivate.confirmationText')}
          </p>

          <div className="material-summary">
            <h3>{t('deactivate.materialDetails')}</h3>
            <div className="summary-details">
              <div className="summary-item">
                <span className="label">{t('deactivate.labels.name')}</span>
                <span className="value">{material.name} ({material.color})</span>
              </div>
              <div className="summary-item">
                <span className="label">{t('deactivate.labels.type')}</span>
                <span className="value">
                  {material.type === MaterialType.RawMaterial 
                    ? t('filters.rawMaterials')
                    : material.type === MaterialType.RecyclableMaterial
                    ? t('filters.recyclableMaterials')
                    : t('filters.finishedProducts')}
                </span>
              </div>
              <div className="summary-item">
                <span className="label">{t('deactivate.labels.currentStock')}</span>
                <span className="value">
                  {material.quantity.toLocaleString()} {material.quantityType}
                </span>
              </div>
              <div className="summary-item">
                <span className="label">{t('deactivate.labels.lastUpdated')}</span>
                <span className="value">{formatDate(material.updatedAt)}</span>
              </div>
            </div>
          </div>

          {material.description && (
            <div className="material-description-section">
              <strong>{t('deactivate.labels.description')}</strong>
              <p>{material.description}</p>
            </div>
          )}

          <div className="info-section">
            <div className="info-icon">ℹ️</div>
            <div className="info-text">
              <strong>{t('common:labels.notes', { defaultValue: 'Note' })}:</strong> {t('deactivate.note')}
            </div>
          </div>
        </div>

        <div className="delete-material-confirmation-actions">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            disabled={isLoading}
          >
            {t('deactivate.buttons.cancel')}
          </button>
          <button
            type="button"
            onClick={handleDeactivate}
            className="btn btn-danger"
            disabled={isLoading}
          >
            {isLoading ? t('deactivate.buttons.deactivating') : t('deactivate.buttons.deactivateMaterial')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteMaterialConfirmation;
