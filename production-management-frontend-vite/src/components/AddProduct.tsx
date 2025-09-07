import React, { useState, useEffect } from 'react';
import { productionApi, inventoryApi } from '../services/api';
import type { Product, CreateProductRequest, CreateProductMaterialRequest, RawMaterial } from '../types';
import './AddProduct.css';

interface AddProductProps {
  onClose: () => void;
  onProductCreated: (product: Product) => void;
}

const AddProduct: React.FC<AddProductProps> = ({ onClose, onProductCreated }) => {
  const [availableMaterials, setAvailableMaterials] = useState<RawMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateProductRequest>({
    name: '',
    description: '',
    category: '',
    sellingPrice: 0,
    estimatedProductionTimeMinutes: 0,
    requiredMaterials: []
  });

  const [newMaterial, setNewMaterial] = useState<CreateProductMaterialRequest>({
    materialId: 0,
    requiredQuantity: 0
  });

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      const response = await inventoryApi.getAllMaterials();
      setAvailableMaterials(response.data.filter(m => m.isActive));
    } catch (error: any) {
      console.error('Error loading materials:', error);
      setError('Failed to load materials. Please try again.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleMaterialChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setNewMaterial(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : parseInt(value) || 0
    }));
  };

  const addMaterial = () => {
    if (newMaterial.materialId === 0 || newMaterial.requiredQuantity <= 0) {
      setError('Please select a material and enter a valid quantity.');
      return;
    }

    // Check if material is already added
    if (formData.requiredMaterials.some(m => m.materialId === newMaterial.materialId)) {
      setError('This material is already added to the product.');
      return;
    }

    setFormData(prev => ({
      ...prev,
      requiredMaterials: [...prev.requiredMaterials, { ...newMaterial }]
    }));

    setNewMaterial({ materialId: 0, requiredQuantity: 0 });
    setError(null);
  };

  const removeMaterial = (materialId: number) => {
    setFormData(prev => ({
      ...prev,
      requiredMaterials: prev.requiredMaterials.filter(m => m.materialId !== materialId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (formData.requiredMaterials.length === 0) {
      setError('Please add at least one material requirement.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await productionApi.createProduct(formData);
      onProductCreated(response.data);
      onClose();
    } catch (error: any) {
      console.error('Error creating product:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create product. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getMaterialInfo = (materialId: number) => {
    return availableMaterials.find(m => m.id === materialId);
  };

  const calculateEstimatedCost = () => {
    return formData.requiredMaterials.reduce((total, reqMaterial) => {
      const material = getMaterialInfo(reqMaterial.materialId);
      return total + (material ? reqMaterial.requiredQuantity * material.unitCost : 0);
    }, 0);
  };

  const estimatedCost = calculateEstimatedCost();
  const estimatedProfit = formData.sellingPrice - estimatedCost;

  const commonCategories = ['Furniture', 'Construction', 'Electronics', 'Automotive', 'Tools', 'Hardware', 'Custom'];

  return (
    <div className="add-product-overlay">
      <div className="add-product-modal">
        <div className="add-product-header">
          <h2>🏭 Create New Product</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="add-product-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-section">
            <h3>Product Information</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Product Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Steel Cabinet, Aluminum Frame"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                >
                  <option value="">Select Category</option>
                  {commonCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the product..."
                rows={3}
                disabled={isLoading}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="sellingPrice">Selling Price ($) *</label>
                <input
                  type="number"
                  id="sellingPrice"
                  name="sellingPrice"
                  value={formData.sellingPrice}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="estimatedProductionTimeMinutes">Production Time (minutes) *</label>
                <input
                  type="number"
                  id="estimatedProductionTimeMinutes"
                  name="estimatedProductionTimeMinutes"
                  value={formData.estimatedProductionTimeMinutes}
                  onChange={handleInputChange}
                  min="1"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Required Materials</h3>
            
            <div className="add-material-section">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="materialId">Material</label>
                  <select
                    id="materialId"
                    name="materialId"
                    value={newMaterial.materialId}
                    onChange={handleMaterialChange}
                    disabled={isLoading}
                  >
                    <option value={0}>Select material...</option>
                    {availableMaterials.map(material => (
                      <option key={material.id} value={material.id}>
                        {material.name} ({material.color}) - {material.quantity} {material.quantityType} available
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="requiredQuantity">Required Quantity</label>
                  <input
                    type="number"
                    id="requiredQuantity"
                    name="requiredQuantity"
                    value={newMaterial.requiredQuantity}
                    onChange={handleMaterialChange}
                    min="0.01"
                    step="0.01"
                    placeholder="Quantity needed"
                    disabled={isLoading}
                  />
                </div>
                <div className="form-group">
                  <label>&nbsp;</label>
                  <button
                    type="button"
                    onClick={addMaterial}
                    className="add-material-button"
                    disabled={isLoading}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {formData.requiredMaterials.length > 0 && (
              <div className="materials-list">
                <h4>Required Materials:</h4>
                {formData.requiredMaterials.map((reqMaterial) => {
                  const material = getMaterialInfo(reqMaterial.materialId);
                  return (
                    <div key={reqMaterial.materialId} className="material-item">
                      <div className="material-info">
                        <div className="material-name">
                          {material?.name} ({material?.color})
                        </div>
                        <div className="material-details">
                          {reqMaterial.requiredQuantity} {material?.quantityType} 
                          {material && ` @ $${material.unitCost.toFixed(2)} each = $${(reqMaterial.requiredQuantity * material.unitCost).toFixed(2)}`}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMaterial(reqMaterial.materialId)}
                        className="remove-material-button"
                        disabled={isLoading}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {formData.requiredMaterials.length > 0 && (
            <div className="cost-calculation">
              <div className="cost-row">
                <span className="cost-label">Estimated Cost:</span>
                <span className="cost-value">${estimatedCost.toFixed(2)}</span>
              </div>
              <div className="cost-row">
                <span className="cost-label">Selling Price:</span>
                <span className="cost-value">${formData.sellingPrice.toFixed(2)}</span>
              </div>
              <div className="cost-row profit-row">
                <span className="cost-label">Estimated Profit:</span>
                <span className={`cost-value ${estimatedProfit >= 0 ? 'positive' : 'negative'}`}>
                  ${estimatedProfit.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="cancel-button"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={isLoading || formData.requiredMaterials.length === 0}
            >
              {isLoading ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;
