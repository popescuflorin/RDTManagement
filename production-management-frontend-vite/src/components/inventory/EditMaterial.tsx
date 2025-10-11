import React, { useState } from 'react';
import { inventoryApi } from '../../services/api';
import type { RawMaterial, UpdateRawMaterialRequest } from '../../types';
import './EditMaterial.css';

interface EditMaterialProps {
  material: RawMaterial;
  onClose: () => void;
  onMaterialUpdated: (updatedMaterial: RawMaterial) => void;
}

const EditMaterial: React.FC<EditMaterialProps> = ({ material, onClose, onMaterialUpdated }) => {
  const [formData, setFormData] = useState<UpdateRawMaterialRequest>({
    name: material.name,
    color: material.color,
    quantity: material.quantity,
    quantityType: material.quantityType,
    minimumStock: material.minimumStock,
    unitCost: material.unitCost,
    description: material.description || '',
    isActive: material.isActive
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : 
              type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await inventoryApi.updateMaterial(material.id, formData);
      onMaterialUpdated(response.data);
      onClose();
    } catch (error: any) {
      console.error('Error updating material:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update material. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const commonQuantityTypes = ['kg', 'liters', 'pieces', 'meters', 'grams', 'tons'];
  const commonColors = ['Silver', 'Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Purple', 'Brown', 'Gray', 'Clear'];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const calculatedTotalValue = formData.quantity * formData.unitCost;

  return (
    <div className="edit-material-overlay">
      <div className="edit-material-modal">
        <div className="edit-material-header">
          <h2>✏️ Edit Material</h2>
          <button className="btn btn-sm btn-secondary" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="edit-material-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="material-summary">
            <h3>Current Material:</h3>
            <div className="summary-details">
              <div className="summary-item">
                <span className="label">Name:</span>
                <span className="value">{material.name}</span>
              </div>
              <div className="summary-item">
                <span className="label">Current Value:</span>
                <span className="value">{formatCurrency(material.totalValue)}</span>
              </div>
              <div className="summary-item">
                <span className="label">Last Updated:</span>
                <span className="value">{new Date(material.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Material Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="color">Color</label>
              <select
                id="color"
                name="color"
                value={formData.color}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              >
                <option value="">Select Color</option>
                {commonColors.map(color => (
                  <option key={color} value={color}>{color}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="quantity">Current Quantity</label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="quantityType">Unit Type</label>
              <select
                id="quantityType"
                name="quantityType"
                value={formData.quantityType}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              >
                <option value="">Select Unit</option>
                {commonQuantityTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="minimumStock">Minimum Stock Level</label>
              <input
                type="number"
                id="minimumStock"
                name="minimumStock"
                value={formData.minimumStock}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                disabled={isLoading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="unitCost">Unit Cost ($)</label>
              <input
                type="number"
                id="unitCost"
                name="unitCost"
                value={formData.unitCost}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Optional description of the material..."
                rows={3}
                disabled={isLoading}
              />
            </div>
            <div className="form-group status-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
                <span className="checkbox-text">Material is Active</span>
              </label>
              <div className="calculated-value">
                <div className="calculation-label">New Total Value:</div>
                <div className="calculation-result">{formatCurrency(calculatedTotalValue)}</div>
              </div>
            </div>
          </div>

          {/* Stock Status Indicators */}
          <div className="stock-indicators">
            <div className={`stock-indicator ${formData.quantity <= formData.minimumStock ? 'warning' : 'good'}`}>
              <div className="indicator-icon">
                {formData.quantity <= formData.minimumStock ? '⚠️' : '✅'}
              </div>
              <div className="indicator-text">
                {formData.quantity <= formData.minimumStock 
                  ? `Low Stock Warning! (${formData.quantity} ≤ ${formData.minimumStock})`
                  : `Stock Level OK (${formData.quantity} > ${formData.minimumStock})`
                }
              </div>
            </div>
            {!formData.isActive && (
              <div className="stock-indicator inactive">
                <div className="indicator-icon">🚫</div>
                <div className="indicator-text">Material will be marked as inactive</div>
              </div>
            )}
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Updating...' : 'Update Material'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMaterial;
