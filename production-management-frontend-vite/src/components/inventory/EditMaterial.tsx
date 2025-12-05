import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { inventoryApi } from '../../services/api';
import type { RawMaterial, UpdateRawMaterialRequest } from '../../types';
import { MaterialType } from '../../types';
import './EditMaterial.css';

interface EditMaterialProps {
  material: RawMaterial;
  onClose: () => void;
  onMaterialUpdated: (updatedMaterial: RawMaterial) => void;
}

const EditMaterial: React.FC<EditMaterialProps> = ({ material, onClose, onMaterialUpdated }) => {
  const { t } = useTranslation(['inventory', 'common']);
  const [formData, setFormData] = useState<UpdateRawMaterialRequest>({
    name: material.name,
    color: material.color,
    type: material.type,
    quantity: material.quantity,
    quantityType: material.quantityType,
    minimumStock: material.minimumStock,
    unitCost: material.unitCost,
    description: material.description || '',
    isActive: material.isActive
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    // Prevent number input from changing value when scrolling
    if (e.currentTarget.type === 'number') {
      e.currentTarget.blur();
    }
  };

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
      const errorMessage = error.response?.data?.message || t('edit.messages.failedToUpdate');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const commonQuantityTypes = ['kg', 'liters', 'pieces', 'meters', 'grams', 'tons'];

  return (
    <div className="edit-material-overlay">
      <div className="edit-material-modal">
        <div className="edit-material-header">
          <h2>✏️ {t('edit.title')}</h2>
          <button className="btn btn-sm btn-secondary" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="edit-material-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="material-summary">
            <h3>{t('edit.currentMaterial')}</h3>
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
                <span className="label">{t('edit.fields.lastUpdated')}</span>
                <span className="value">{new Date(material.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">{t('form.fields.materialName')} *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder={t('form.placeholders.materialName')}
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="color">{t('form.fields.color')} *</label>
              <input
                type="text"
                id="color"
                name="color"
                value={formData.color}
                onChange={handleInputChange}
                placeholder={t('form.placeholders.color')}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="type">{t('form.fields.materialType')} *</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              >
                <option value={MaterialType.RawMaterial}>{t('filters.rawMaterials')}</option>
                <option value={MaterialType.RecyclableMaterial}>{t('filters.recyclableMaterials')}</option>
                <option value={MaterialType.FinishedProduct}>{t('filters.finishedProducts')}</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="quantityType">{t('form.fields.unitType')} *</label>
              <input
                type="text"
                id="quantityType"
                name="quantityType"
                value={formData.quantityType}
                onChange={handleInputChange}
                placeholder={t('form.placeholders.unitType')}
                required
                disabled={isLoading}
                list="quantityTypeOptions"
              />
              <datalist id="quantityTypeOptions">
                {commonQuantityTypes.map(type => (
                  <option key={type} value={type} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="quantity">{t('edit.fields.currentQuantity')} *</label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                onWheel={handleWheel}
                min="0"
                step="0.01"
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="minimumStock">{t('form.fields.minimumStockLevel')}</label>
              <input
                type="number"
                id="minimumStock"
                name="minimumStock"
                value={formData.minimumStock}
                onChange={handleInputChange}
                onWheel={handleWheel}
                min="0"
                step="0.01"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">{t('form.fields.description')}</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder={t('form.placeholders.description')}
              rows={3}
              disabled={isLoading}
            />
          </div>

          {/* Stock Status Indicators */}
          <div className="stock-indicators">
            <div className={`stock-indicator ${formData.quantity <= formData.minimumStock ? 'warning' : 'good'}`}>
              <div className="indicator-icon">
                {formData.quantity <= formData.minimumStock ? '⚠️' : '✅'}
              </div>
              <div className="indicator-text">
                {formData.quantity <= formData.minimumStock 
                  ? t('edit.stockIndicators.lowStockWarning', { quantity: formData.quantity, minimum: formData.minimumStock })
                  : t('edit.stockIndicators.stockLevelOk', { quantity: formData.quantity, minimum: formData.minimumStock })
                }
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={isLoading}
            >
              {t('edit.buttons.cancel')}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? t('edit.buttons.updating') : t('edit.buttons.updateMaterial')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMaterial;
