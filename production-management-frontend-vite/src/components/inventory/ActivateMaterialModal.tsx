import React, { useState } from 'react';
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
      const errorMessage = error.response?.data?.message || 'Failed to activate material. Please try again.';
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
          <h2>✅ Activate Material</h2>
          <button className="btn btn-sm btn-secondary" onClick={onClose}>×</button>
        </div>

        <div className="activate-material-content">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <p className="confirmation-text">
            Are you sure you want to activate this material? The material will be marked as active 
            and will appear in active inventory lists.
          </p>

          <div className="material-summary">
            <h3>Material Details:</h3>
            <div className="summary-details">
              <div className="summary-item">
                <span className="label">Name:</span>
                <span className="value">{material.name} ({material.color})</span>
              </div>
              <div className="summary-item">
                <span className="label">Type:</span>
                <span className="value">
                  {material.type === MaterialType.RawMaterial ? 'Raw Material' : 'Recyclable Material'}
                </span>
              </div>
              <div className="summary-item">
                <span className="label">Current Stock:</span>
                <span className="value">
                  {material.quantity.toLocaleString()} {material.quantityType}
                </span>
              </div>
              <div className="summary-item">
                <span className="label">Minimum Stock:</span>
                <span className="value">
                  {material.minimumStock.toLocaleString()} {material.quantityType}
                </span>
              </div>
              <div className="summary-item">
                <span className="label">Last Updated:</span>
                <span className="value">{formatDate(material.updatedAt)}</span>
              </div>
            </div>
          </div>

          {material.description && (
            <div className="material-description-section">
              <strong>Description:</strong>
              <p>{material.description}</p>
            </div>
          )}

          <div className="info-section">
            <div className="info-icon">ℹ️</div>
            <div className="info-text">
              <strong>Note:</strong> Once activated, this material will be available for use in production 
              and will appear in all active inventory lists.
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
            Cancel
          </button>
          <button
            type="button"
            onClick={handleActivate}
            className="btn btn-success"
            disabled={isLoading}
          >
            {isLoading ? 'Activating...' : 'Activate Material'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivateMaterialModal;

