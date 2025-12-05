import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { inventoryApi } from '../../services/api';
import type { RawMaterial, CreateRawMaterialRequest, AddToExistingMaterialRequest, MaterialTypeInfo } from '../../types';
import { MaterialType } from '../../types';
import './AddMaterial.css';

interface AddMaterialProps {
  onClose: () => void;
  onMaterialCreated: (material: RawMaterial) => void;
}

const AddMaterial: React.FC<AddMaterialProps> = ({ onClose, onMaterialCreated }) => {
  const { t } = useTranslation(['inventory', 'common']);
  const [mode, setMode] = useState<'new' | 'existing'>('new');
  const [materialTypes, setMaterialTypes] = useState<MaterialTypeInfo[]>([]);
  const [existingMaterials, setExistingMaterials] = useState<RawMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New material form data
  const [newMaterialData, setNewMaterialData] = useState<CreateRawMaterialRequest>({
    name: '',
    color: '',
    type: MaterialType.RawMaterial,
    quantity: 0,
    quantityType: '',
    minimumStock: 0,
    unitCost: 0,
    description: ''
  });

  // Existing material form data
  const [existingMaterialData, setExistingMaterialData] = useState<AddToExistingMaterialRequest>({
    materialId: 0,
    quantityToAdd: 0,
    newUnitCost: undefined
  });

  const [selectedExistingMaterial, setSelectedExistingMaterial] = useState<RawMaterial | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [typesResponse, materialsResponse] = await Promise.all([
        inventoryApi.getMaterialTypes(),
        inventoryApi.getAllMaterials()
      ]);
      setMaterialTypes(typesResponse.data);
      setExistingMaterials(materialsResponse.data.filter(m => m.isActive));
    } catch (error: any) {
      console.error('Error loading initial data:', error);
      setError(t('form.messages.failedToLoadData'));
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    // Prevent number input from changing value when scrolling
    if (e.currentTarget.type === 'number') {
      e.currentTarget.blur();
    }
  };

  const handleNewMaterialChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setNewMaterialData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleExistingMaterialChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (name === 'materialId') {
      const materialId = parseInt(value);
      const material = existingMaterials.find(m => m.id === materialId);
      setSelectedExistingMaterial(material || null);
      setExistingMaterialData(prev => ({ ...prev, materialId }));
    } else {
      setExistingMaterialData(prev => ({
        ...prev,
        [name]: type === 'number' ? (value ? parseFloat(value) : undefined) : value
      }));
    }
  };

  const handleMaterialTypeSelect = (materialType: MaterialTypeInfo) => {
    setNewMaterialData(prev => ({
      ...prev,
      name: materialType.name,
      color: materialType.color,
      type: MaterialType.RawMaterial,
      quantityType: materialType.quantityType,
      description: materialType.description || ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      let response;
      
      if (mode === 'new') {
        response = await inventoryApi.createMaterial(newMaterialData);
      } else {
        response = await inventoryApi.addToExisting(existingMaterialData);
      }
      
      onMaterialCreated(response.data);
      onClose();
    } catch (error: any) {
      console.error('Error adding material:', error);
      const errorMessage = error.response?.data?.message || t('form.messages.failedToAdd');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = () => {
    if (mode === 'new') {
      return newMaterialData.name && 
             newMaterialData.color && 
             newMaterialData.quantityType && 
             newMaterialData.quantity > 0;
    } else {
      return existingMaterialData.materialId > 0 && 
             existingMaterialData.quantityToAdd > 0;
    }
  };

  const commonQuantityTypes = ['kg', 'liters', 'pieces', 'meters', 'grams', 'tons'];

  return (
    <div className="add-material-overlay">
      <div className="add-material-modal">
        <div className="add-material-header">
          <h2>📦 {t('form.addTitle')}</h2>
          <button className="btn btn-sm btn-secondary" onClick={onClose}>×</button>
        </div>

        <div className="mode-selector">
          <button 
            className={`mode-button ${mode === 'new' ? 'active' : ''}`}
            onClick={() => setMode('new')}
          >
            ✨ {t('form.modes.createNew')}
          </button>
          <button 
            className={`mode-button ${mode === 'existing' ? 'active' : ''}`}
            onClick={() => setMode('existing')}
          >
            📈 {t('form.modes.addToExisting')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="add-material-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {mode === 'new' ? (
            <>
              {/* Quick Select from Existing Types */}
              {materialTypes.length > 0 && (
                <div className="quick-select-section">
                  <h3>{t('form.sections.quickSelect')}</h3>
                  <div className="material-types-grid">
                    {materialTypes.map((type, index) => (
                      <button
                        key={index}
                        type="button"
                        className="material-type-card"
                        onClick={() => handleMaterialTypeSelect(type)}
                      >
                        <div className="type-name">{type.name}</div>
                        <div className="type-details">
                          <span className="type-color">{type.color}</span>
                          <span className="type-unit">({type.quantityType})</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="divider">{t('form.sections.orCreateNew')}</div>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">{t('form.fields.materialName')} *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={newMaterialData.name}
                    onChange={handleNewMaterialChange}
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
                    value={newMaterialData.color}
                    onChange={handleNewMaterialChange}
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
                    value={newMaterialData.type}
                    onChange={handleNewMaterialChange}
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
                    value={newMaterialData.quantityType}
                    onChange={handleNewMaterialChange}
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
                  <label htmlFor="quantity">{t('form.fields.initialQuantity')} *</label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    value={newMaterialData.quantity}
                    onChange={handleNewMaterialChange}
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
                    value={newMaterialData.minimumStock}
                    onChange={handleNewMaterialChange}
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
                  value={newMaterialData.description}
                  onChange={handleNewMaterialChange}
                  placeholder={t('form.placeholders.description')}
                  rows={3}
                  disabled={isLoading}
                />
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label htmlFor="materialId">{t('form.fields.selectExistingMaterial')} *</label>
                <select
                  id="materialId"
                  name="materialId"
                  value={existingMaterialData.materialId}
                  onChange={handleExistingMaterialChange}
                  required
                  disabled={isLoading}
                >
                  <option value={0}>{t('form.placeholders.chooseMaterial')}</option>
                  {existingMaterials.map(material => (
                    <option key={material.id} value={material.id}>
                      {material.name} ({material.color}) - {t('form.labels.current')}: {material.quantity} {material.quantityType}
                      {material.isLowStock && ` - ${t('status.lowStock').toUpperCase()}!`}
                    </option>
                  ))}
                </select>
              </div>

              {selectedExistingMaterial && (
                <div className="selected-material-info">
                  <h4>{t('form.labels.selectedMaterial')}</h4>
                  <div className="material-details">
                    <div className="detail-row">
                      <span className="label">{t('form.labels.name')}</span>
                      <span className="value">{selectedExistingMaterial.name}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">{t('form.labels.color')}</span>
                      <span className="value">{selectedExistingMaterial.color}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">{t('form.labels.type')}</span>
                      <span className="value">
                        {selectedExistingMaterial.type === MaterialType.RawMaterial 
                          ? t('filters.rawMaterials')
                          : selectedExistingMaterial.type === MaterialType.RecyclableMaterial
                          ? t('filters.recyclableMaterials')
                          : t('filters.finishedProducts')}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="label">{t('form.labels.currentStock')}</span>
                      <span className={`value ${selectedExistingMaterial.isLowStock ? 'low-stock' : ''}`}>
                        {selectedExistingMaterial.quantity} {selectedExistingMaterial.quantityType}
                        {selectedExistingMaterial.isLowStock && ` (${t('form.labels.lowStock')})`}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="quantityToAdd">{t('form.fields.quantityToAdd')} *</label>
                  <input
                    type="number"
                    id="quantityToAdd"
                    name="quantityToAdd"
                    value={existingMaterialData.quantityToAdd}
                    onChange={handleExistingMaterialChange}
                    onWheel={handleWheel}
                    min="0.01"
                    step="0.01"
                    placeholder={selectedExistingMaterial ? `${t('common:buttons.add', { defaultValue: 'Add' })} ${selectedExistingMaterial.quantityType}` : t('form.placeholders.quantity')}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
            </>
          )}

          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={isLoading}
            >
              {t('form.buttons.cancel')}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || !isFormValid()}
            >
              {isLoading ? t('form.buttons.adding') : mode === 'new' ? t('form.buttons.createMaterial') : t('form.buttons.addToStock')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMaterial;
