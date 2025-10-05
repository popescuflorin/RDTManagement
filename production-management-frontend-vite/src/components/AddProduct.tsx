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

  // Material search state
  const [materialSearchTerm, setMaterialSearchTerm] = useState('');
  const [showMaterialDropdown, setShowMaterialDropdown] = useState(false);
  const [showCreateNewMaterial, setShowCreateNewMaterial] = useState(false);
  const [newMaterialForm, setNewMaterialForm] = useState({
    name: '',
    color: '',
    description: '',
    quantityType: '',
    quantity: 0
  });

  useEffect(() => {
    loadMaterials();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.material-search-container')) {
        setShowMaterialDropdown(false);
      }
    };

    if (showMaterialDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMaterialDropdown]);

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

  // Filter materials based on search term
  const filteredMaterials = availableMaterials.filter(material =>
    material.name.toLowerCase().includes(materialSearchTerm.toLowerCase()) ||
    material.color.toLowerCase().includes(materialSearchTerm.toLowerCase())
  );

  // Handle material search input
  const handleMaterialSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMaterialSearchTerm(value);
    setShowMaterialDropdown(true);
    
    if (value.trim() === '') {
      setNewMaterial({ materialId: 0, requiredQuantity: 0 });
    }
  };

  // Handle material selection from dropdown
  const handleMaterialSelect = (material: RawMaterial) => {
    setNewMaterial(prev => ({ ...prev, materialId: material.id }));
    setMaterialSearchTerm(`${material.name} (${material.color})`);
    setShowMaterialDropdown(false);
    setShowCreateNewMaterial(false);
  };

  // Handle "Create new material" option
  const handleCreateNewMaterial = () => {
    setShowCreateNewMaterial(true);
    setShowMaterialDropdown(false);
    setNewMaterial({ materialId: 0, requiredQuantity: 0 });
    setMaterialSearchTerm('');
  };

  // Create new material
  const createNewMaterial = async () => {
    if (!newMaterialForm.name || !newMaterialForm.color || !newMaterialForm.quantityType) {
      setError('Please fill in all required fields for the new material.');
      return;
    }

    try {
      const response = await inventoryApi.createMaterial({
        name: newMaterialForm.name,
        color: newMaterialForm.color,
        description: newMaterialForm.description,
        quantity: newMaterialForm.quantity,
        quantityType: newMaterialForm.quantityType,
        minimumStock: 0,
        unitCost: 0
      });

      // Add the new material to available materials
      setAvailableMaterials(prev => [...prev, response.data]);
      
      // Select the newly created material
      setNewMaterial(prev => ({ ...prev, materialId: response.data.id }));
      setMaterialSearchTerm(`${response.data.name} (${response.data.color})`);
      
      // Reset form
      setNewMaterialForm({
        name: '',
        color: '',
        description: '',
        quantityType: '',
        quantity: 0
      });
      setShowCreateNewMaterial(false);
      setError(null);
    } catch (error: any) {
      console.error('Error creating material:', error);
      setError('Failed to create material. Please try again.');
    }
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
                <div className="form-group material-search-group">
                  <label htmlFor="materialSearch">Material</label>
                  <div className="material-search-container">
                    <input
                      type="text"
                      id="materialSearch"
                      value={materialSearchTerm}
                      onChange={handleMaterialSearchChange}
                      onFocus={() => setShowMaterialDropdown(true)}
                      placeholder="Search for material or create new..."
                      disabled={isLoading}
                      className="material-search-input"
                    />
                    {showMaterialDropdown && (
                      <div className="material-dropdown">
                        {filteredMaterials.length > 0 ? (
                          filteredMaterials.map(material => (
                            <div
                              key={material.id}
                              className="material-option"
                              onClick={() => handleMaterialSelect(material)}
                            >
                              <div className="material-option-main">
                                <span className="material-name">{material.name}</span>
                                <span className="material-color">({material.color})</span>
                              </div>
                              <div className="material-option-details">
                                {material.quantity} {material.quantityType} available
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="material-option no-results">
                            No materials found
                          </div>
                        )}
                        <div
                          className="material-option create-new"
                          onClick={handleCreateNewMaterial}
                        >
                          + Create New Material
                        </div>
                      </div>
                    )}
                  </div>
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

              {/* Create New Material Form */}
              {showCreateNewMaterial && (
                <div className="create-new-material-form">
                  <h4>Create New Material</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="newMaterialName">Material Name *</label>
                      <input
                        type="text"
                        id="newMaterialName"
                        value={newMaterialForm.name}
                        onChange={(e) => setNewMaterialForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter material name"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="newMaterialColor">Color *</label>
                      <input
                        type="text"
                        id="newMaterialColor"
                        value={newMaterialForm.color}
                        onChange={(e) => setNewMaterialForm(prev => ({ ...prev, color: e.target.value }))}
                        placeholder="Enter material color"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="newMaterialQuantityType">Unit of Measure *</label>
                      <input
                        type="text"
                        id="newMaterialQuantityType"
                        value={newMaterialForm.quantityType}
                        onChange={(e) => setNewMaterialForm(prev => ({ ...prev, quantityType: e.target.value }))}
                        placeholder="e.g., kg, liters, pieces"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="newMaterialQuantity">Initial Quantity</label>
                      <input
                        type="number"
                        id="newMaterialQuantity"
                        value={newMaterialForm.quantity}
                        onChange={(e) => setNewMaterialForm(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="newMaterialDescription">Description</label>
                    <textarea
                      id="newMaterialDescription"
                      value={newMaterialForm.description}
                      onChange={(e) => setNewMaterialForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Material description"
                      rows={2}
                    />
                  </div>
                  <div className="create-material-actions">
                    <button
                      type="button"
                      onClick={createNewMaterial}
                      className="create-material-button"
                      disabled={isLoading}
                    >
                      Create Material
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateNewMaterial(false);
                        setNewMaterialForm({
                          name: '',
                          color: '',
                          description: '',
                          quantityType: '',
                          quantity: 0
                        });
                      }}
                      className="cancel-create-button"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
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
