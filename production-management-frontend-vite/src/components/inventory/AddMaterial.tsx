import React, { useState, useEffect } from 'react';
import { inventoryApi } from '../../services/api';
import type { RawMaterial, CreateRawMaterialRequest, AddToExistingMaterialRequest, MaterialTypeInfo } from '../../types';
import { MaterialType } from '../../types';
import './AddMaterial.css';

interface AddMaterialProps {
  onClose: () => void;
  onMaterialCreated: (material: RawMaterial) => void;
}

const AddMaterial: React.FC<AddMaterialProps> = ({ onClose, onMaterialCreated }) => {
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
      setError('Failed to load material data. Please try again.');
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
      const errorMessage = error.response?.data?.message || 'Failed to add material. Please try again.';
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
          <h2>📦 Add Material to Inventory</h2>
          <button className="btn btn-sm btn-secondary" onClick={onClose}>×</button>
        </div>

        <div className="mode-selector">
          <button 
            className={`mode-button ${mode === 'new' ? 'active' : ''}`}
            onClick={() => setMode('new')}
          >
            ✨ Create New Material
          </button>
          <button 
            className={`mode-button ${mode === 'existing' ? 'active' : ''}`}
            onClick={() => setMode('existing')}
          >
            📈 Add to Existing
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
                  <h3>Quick Select from Existing Types:</h3>
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
                  <div className="divider">OR Create Completely New Material</div>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Material Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={newMaterialData.name}
                    onChange={handleNewMaterialChange}
                    placeholder="e.g., Steel Sheets, Paint, Screws"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="color">Color *</label>
                  <input
                    type="text"
                    id="color"
                    name="color"
                    value={newMaterialData.color}
                    onChange={handleNewMaterialChange}
                    placeholder="e.g., Silver, Black, Red"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="type">Material Type *</label>
                  <select
                    id="type"
                    name="type"
                    value={newMaterialData.type}
                    onChange={handleNewMaterialChange}
                    required
                    disabled={isLoading}
                  >
                    <option value={MaterialType.RawMaterial}>Raw Material</option>
                    <option value={MaterialType.RecyclableMaterial}>Recyclable Material</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="quantityType">Unit Type *</label>
                  <input
                    type="text"
                    id="quantityType"
                    name="quantityType"
                    value={newMaterialData.quantityType}
                    onChange={handleNewMaterialChange}
                    placeholder="e.g., kg, liters, pieces"
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
                  <label htmlFor="quantity">Initial Quantity *</label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    value={newMaterialData.quantity}
                    onChange={handleNewMaterialChange}
                    min="0"
                    step="0.01"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="minimumStock">Minimum Stock Level</label>
                  <input
                    type="number"
                    id="minimumStock"
                    name="minimumStock"
                    value={newMaterialData.minimumStock}
                    onChange={handleNewMaterialChange}
                    min="0"
                    step="0.01"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={newMaterialData.description}
                  onChange={handleNewMaterialChange}
                  placeholder="Optional description of the material..."
                  rows={3}
                  disabled={isLoading}
                />
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label htmlFor="materialId">Select Existing Material *</label>
                <select
                  id="materialId"
                  name="materialId"
                  value={existingMaterialData.materialId}
                  onChange={handleExistingMaterialChange}
                  required
                  disabled={isLoading}
                >
                  <option value={0}>Choose material to restock...</option>
                  {existingMaterials.map(material => (
                    <option key={material.id} value={material.id}>
                      {material.name} ({material.color}) - Current: {material.quantity} {material.quantityType}
                      {material.isLowStock && ' - LOW STOCK!'}
                    </option>
                  ))}
                </select>
              </div>

              {selectedExistingMaterial && (
                <div className="selected-material-info">
                  <h4>Selected Material:</h4>
                  <div className="material-details">
                    <div className="detail-row">
                      <span className="label">Name:</span>
                      <span className="value">{selectedExistingMaterial.name}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Color:</span>
                      <span className="value">{selectedExistingMaterial.color}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Type:</span>
                      <span className="value">
                        {selectedExistingMaterial.type === MaterialType.RawMaterial ? 'Raw Material' : 'Recyclable Material'}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Current Stock:</span>
                      <span className={`value ${selectedExistingMaterial.isLowStock ? 'low-stock' : ''}`}>
                        {selectedExistingMaterial.quantity} {selectedExistingMaterial.quantityType}
                        {selectedExistingMaterial.isLowStock && ' (Low Stock!)'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="quantityToAdd">Quantity to Add *</label>
                  <input
                    type="number"
                    id="quantityToAdd"
                    name="quantityToAdd"
                    value={existingMaterialData.quantityToAdd}
                    onChange={handleExistingMaterialChange}
                    min="0.01"
                    step="0.01"
                    placeholder={selectedExistingMaterial ? `Add ${selectedExistingMaterial.quantityType}` : 'Quantity'}
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
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || !isFormValid()}
            >
              {isLoading ? 'Adding...' : mode === 'new' ? 'Create Material' : 'Add to Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMaterial;
