import React, { useState } from 'react';
import { inventoryApi } from '../services/api';
import type { RawMaterial } from '../types';
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await inventoryApi.deleteMaterial(material.id);
      onMaterialDeleted(material.id);
      onClose();
    } catch (error: any) {
      console.error('Error deleting material:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete material. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
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
          <div className="warning-icon">⚠️</div>
          <h2>Delete Material</h2>
        </div>

        <div className="delete-material-confirmation-content">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <p className="confirmation-text">
            Are you sure you want to permanently delete this material from your inventory? 
            This action cannot be undone.
          </p>

          <div className="material-details-card">
            <div className="material-header">
              <div className="material-name-section">
                <div className="material-name">{material.name}</div>
                <div className="material-color">
                  <span 
                    className="color-dot" 
                    style={{ backgroundColor: material.color.toLowerCase() }}
                  ></span>
                  {material.color}
                </div>
              </div>
              <div className="material-status">
                <span className={`status-badge ${material.isActive ? 'active' : 'inactive'}`}>
                  {material.isActive ? 'Active' : 'Inactive'}
                </span>
                {material.isLowStock && (
                  <span className="low-stock-badge">Low Stock</span>
                )}
              </div>
            </div>

            <div className="material-info-grid">
              <div className="info-item">
                <div className="info-label">Current Stock</div>
                <div className="info-value">
                  {material.quantity.toLocaleString()} {material.quantityType}
                </div>
              </div>
              <div className="info-item">
                <div className="info-label">Minimum Stock</div>
                <div className="info-value">
                  {material.minimumStock.toLocaleString()} {material.quantityType}
                </div>
              </div>
              <div className="info-item">
                <div className="info-label">Unit Cost</div>
                <div className="info-value">{formatCurrency(material.unitCost)}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Total Value</div>
                <div className="info-value total-value">{formatCurrency(material.totalValue)}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Created</div>
                <div className="info-value">{formatDate(material.createdAt)}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Last Updated</div>
                <div className="info-value">{formatDate(material.updatedAt)}</div>
              </div>
            </div>

            {material.description && (
              <div className="material-description">
                <div className="description-label">Description:</div>
                <div className="description-text">{material.description}</div>
              </div>
            )}
          </div>

          <div className="warning-section">
            <div className="warning-header">
              <span className="warning-icon-small">🚨</span>
              <strong>This action will permanently:</strong>
            </div>
            <ul className="warning-list">
              <li>Remove all material data from the system</li>
              <li>Delete the inventory record worth {formatCurrency(material.totalValue)}</li>
              <li>Cannot be recovered or undone</li>
              {material.isLowStock && (
                <li className="warning-highlight">Remove a material that is currently low in stock</li>
              )}
            </ul>
          </div>

          <div className="alternative-suggestion">
            <div className="suggestion-icon">💡</div>
            <div className="suggestion-text">
              <strong>Consider instead:</strong> Mark the material as "Inactive" using the edit function 
              to keep the record but remove it from active inventory.
            </div>
          </div>
        </div>

        <div className="delete-material-confirmation-actions">
          <button
            type="button"
            onClick={onClose}
            className="cancel-button"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="delete-button"
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete Material'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteMaterialConfirmation;
