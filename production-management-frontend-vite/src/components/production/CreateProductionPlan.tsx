import React, { useState, useEffect } from 'react';
import { productionPlanApi, inventoryApi } from '../../services/api';
import type { 
  CreateProductionPlanRequest, 
  ProductionPlan, 
  RawMaterial,
  CreateProductionPlanMaterialRequest,
  UpdateProductTemplateRequest,
  ProductTemplateMaterial
} from '../../types';
import { MaterialType } from '../../types';
import './CreateProductionPlan.css';

interface CreateProductionPlanProps {
  onClose: () => void;
  onPlanCreated: (plan: ProductionPlan) => void;
}

interface MaterialSelection {
  id: string;
  rawMaterialId: number;
  materialName: string;
  materialColor: string;
  quantityType: string;
  requiredQuantity: number;
  availableQuantity: number;
  unitCost: number;
}

const CreateProductionPlan: React.FC<CreateProductionPlanProps> = ({ onClose, onPlanCreated }) => {
  const [finishedProducts, setFinishedProducts] = useState<RawMaterial[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewProductForm, setShowNewProductForm] = useState(false);
  const [templateLoaded, setTemplateLoaded] = useState(false);
  const [originalTemplate, setOriginalTemplate] = useState<MaterialSelection[]>([]);
  const [originalEstimatedTime, setOriginalEstimatedTime] = useState(0);
  const [updateTemplate, setUpdateTemplate] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetProductId: 0,
    quantityToProduce: 1,
    plannedStartDate: new Date().toISOString().split('T')[0], // Default to today
    estimatedProductionTimeMinutes: 60,
    notes: ''
  });

  const [newProduct, setNewProduct] = useState({
    name: '',
    color: '',
    quantityType: 'pieces',
    description: '',
    minimumStock: 0
  });

  const [selectedMaterials, setSelectedMaterials] = useState<MaterialSelection[]>([]);
  const [currentMaterial, setCurrentMaterial] = useState({
    rawMaterialId: 0,
    requiredQuantity: 1
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [finishedProductsResponse, rawMaterialsResponse] = await Promise.all([
        inventoryApi.getAllMaterialsIncludingInactive(),
        inventoryApi.getAllMaterialsIncludingInactive()
      ]);

      const finishedProds = finishedProductsResponse.data.filter(
        (m: RawMaterial) => m.type === MaterialType.FinishedProduct && m.isActive
      );
      const rawMats = rawMaterialsResponse.data.filter(
        (m: RawMaterial) => m.type === MaterialType.RawMaterial && m.isActive
      );

      setFinishedProducts(finishedProds);
      setRawMaterials(rawMats);
    } catch (error: any) {
      console.error('Error loading data:', error);
      setError('Failed to load materials');
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Handle product selection - check if "new" was selected
    if (name === 'targetProductId') {
      if (value === 'new') {
        setShowNewProductForm(true);
        setFormData(prev => ({ ...prev, targetProductId: 0 }));
        setSelectedMaterials([]);
        setTemplateLoaded(false);
        return;
      } else {
        setShowNewProductForm(false);
        const productId = parseInt(value) || 0;
        setFormData(prev => ({ ...prev, targetProductId: productId }));
        
        // Load template if product is selected
        if (productId > 0) {
          await loadProductTemplate(productId);
        } else {
          setSelectedMaterials([]);
          setTemplateLoaded(false);
        }
        return;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const loadProductTemplate = async (productId: number) => {
    try {
      const response = await productionPlanApi.getProductTemplate(productId);
      const template = response.data;
      
      // Load materials from template
      const materials: MaterialSelection[] = template.requiredMaterials.map((m: ProductTemplateMaterial) => ({
        id: Date.now().toString() + '-' + m.rawMaterialId,
        rawMaterialId: m.rawMaterialId,
        materialName: m.materialName,
        materialColor: m.materialColor,
        quantityType: m.quantityType,
        requiredQuantity: m.requiredQuantity,
        availableQuantity: m.availableQuantity,
        unitCost: m.unitCost
      }));
      
      setSelectedMaterials(materials);
      setOriginalTemplate(materials); // Save original for comparison
      setOriginalEstimatedTime(template.estimatedProductionTimeMinutes);
      setTemplateLoaded(true);
      setUpdateTemplate(false); // Reset checkbox
      
      // Update estimated production time
      if (template.estimatedProductionTimeMinutes > 0) {
        setFormData(prev => ({
          ...prev,
          estimatedProductionTimeMinutes: template.estimatedProductionTimeMinutes
        }));
      }
    } catch (error: any) {
      // If no template found, that's okay - user can add materials manually
      console.log('No template found for product, user will add materials manually');
      setSelectedMaterials([]);
      setOriginalTemplate([]);
      setOriginalEstimatedTime(0);
      setTemplateLoaded(false);
      setUpdateTemplate(false);
    }
  };

  const handleNewProductChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setNewProduct(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleAddMaterial = () => {
    if (currentMaterial.rawMaterialId === 0 || currentMaterial.requiredQuantity <= 0) {
      setError('Please select a material and enter a valid quantity');
      return;
    }

    const material = rawMaterials.find(m => m.id === currentMaterial.rawMaterialId);
    if (!material) return;

    // Check if material already added
    if (selectedMaterials.some(m => m.rawMaterialId === currentMaterial.rawMaterialId)) {
      setError('Material already added');
      return;
    }

    const newSelection: MaterialSelection = {
      id: Date.now().toString(),
      rawMaterialId: material.id,
      materialName: material.name,
      materialColor: material.color,
      quantityType: material.quantityType,
      requiredQuantity: currentMaterial.requiredQuantity,
      availableQuantity: material.quantity,
      unitCost: material.unitCost
    };

    setSelectedMaterials(prev => [...prev, newSelection]);
    setCurrentMaterial({ rawMaterialId: 0, requiredQuantity: 1 });
    setError(null);
  };

  const handleRemoveMaterial = (id: string) => {
    setSelectedMaterials(prev => prev.filter(m => m.id !== id));
  };

  const handleUpdateMaterialQuantity = (id: string, quantity: number) => {
    setSelectedMaterials(prev => 
      prev.map(m => m.id === id ? { ...m, requiredQuantity: quantity } : m)
    );
  };

  const hasTemplateChanged = (): boolean => {
    if (!templateLoaded || originalTemplate.length === 0) return false;

    // Check if estimated time changed
    if (formData.estimatedProductionTimeMinutes !== originalEstimatedTime) return true;

    // Check if material count changed
    if (selectedMaterials.length !== originalTemplate.length) return true;

    // Check if any material changed
    for (const selected of selectedMaterials) {
      const original = originalTemplate.find(m => m.rawMaterialId === selected.rawMaterialId);
      if (!original) return true; // New material added
      if (original.requiredQuantity !== selected.requiredQuantity) return true; // Quantity changed
    }

    // Check if any material was removed
    for (const original of originalTemplate) {
      const selected = selectedMaterials.find(m => m.rawMaterialId === original.rawMaterialId);
      if (!selected) return true; // Material removed
    }

    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (selectedMaterials.length === 0) {
        setError('Please add at least one material');
        setIsLoading(false);
        return;
      }

      const requiredMaterials: CreateProductionPlanMaterialRequest[] = selectedMaterials.map(m => ({
        rawMaterialId: m.rawMaterialId,
        requiredQuantity: m.requiredQuantity
      }));

      const request: CreateProductionPlanRequest = {
        name: formData.name,
        description: formData.description,
        quantityToProduce: formData.quantityToProduce,
        plannedStartDate: formData.plannedStartDate || undefined,
        estimatedProductionTimeMinutes: formData.estimatedProductionTimeMinutes,
        notes: formData.notes || undefined,
        requiredMaterials
      };

      if (showNewProductForm) {
        // Creating a new product
        if (!newProduct.name || !newProduct.color || !newProduct.quantityType) {
          setError('Please fill in all required fields for the new product');
          setIsLoading(false);
          return;
        }
        request.newFinishedProduct = newProduct;
      } else {
        // Using existing product
        if (formData.targetProductId === 0) {
          setError('Please select a finished product');
          setIsLoading(false);
          return;
        }
        request.targetProductId = formData.targetProductId;
      }

      const response = await productionPlanApi.createPlan(request);
      
      // Update template if user opted in and template was modified
      if (updateTemplate && templateLoaded && hasTemplateChanged() && formData.targetProductId > 0) {
        try {
          const templateUpdateRequest: UpdateProductTemplateRequest = {
            estimatedProductionTimeMinutes: formData.estimatedProductionTimeMinutes,
            requiredMaterials: selectedMaterials.map(m => ({
              rawMaterialId: m.rawMaterialId,
              requiredQuantity: m.requiredQuantity
            }))
          };
          await productionPlanApi.updateProductTemplate(formData.targetProductId, templateUpdateRequest);
        } catch (templateError) {
          console.error('Error updating template:', templateError);
          // Don't fail the whole operation if template update fails
        }
      }
      
      onPlanCreated(response.data);
      onClose();
    } catch (error: any) {
      console.error('Error creating production plan:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create production plan. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const commonQuantityTypes = ['pieces', 'kg', 'liters', 'meters', 'grams', 'tons'];

  return (
    <div className="create-production-plan-overlay">
      <div className="create-production-plan-modal">
        <div className="create-production-plan-header">
          <h2>📋 Create Production Plan</h2>
          <button className="btn btn-sm btn-secondary" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="create-production-plan-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Target Product Section */}
          <div className="form-section">
            <h3>Target Product</h3>
            
            <div className="form-group">
              <label htmlFor="targetProductId">Select Finished Product *</label>
              <select
                id="targetProductId"
                name="targetProductId"
                value={showNewProductForm ? 'new' : formData.targetProductId}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              >
                <option value={0}>-- Select a product --</option>
                {finishedProducts.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.color}) - Current Stock: {product.quantity} {product.quantityType}
                  </option>
                ))}
                <option value="new">✨ Create New Product</option>
              </select>
            </div>

            {/* New Product Form - shown when "Create New Product" is selected */}
            {showNewProductForm && (
              <div className="new-product-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="newProductName">Product Name *</label>
                    <input
                      type="text"
                      id="newProductName"
                      name="name"
                      value={newProduct.name}
                      onChange={handleNewProductChange}
                      placeholder="e.g., Custom Chair, Table"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="newProductColor">Color *</label>
                    <input
                      type="text"
                      id="newProductColor"
                      name="color"
                      value={newProduct.color}
                      onChange={handleNewProductChange}
                      placeholder="e.g., Brown, White"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="newProductQuantityType">Unit Type *</label>
                    <input
                      type="text"
                      id="newProductQuantityType"
                      name="quantityType"
                      value={newProduct.quantityType}
                      onChange={handleNewProductChange}
                      placeholder="e.g., pieces, kg"
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
                  <div className="form-group">
                    <label htmlFor="newProductMinimumStock">Minimum Stock</label>
                    <input
                      type="number"
                      id="newProductMinimumStock"
                      name="minimumStock"
                      value={newProduct.minimumStock}
                      onChange={handleNewProductChange}
                      min="0"
                      step="1"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="newProductDescription">Description</label>
                  <textarea
                    id="newProductDescription"
                    name="description"
                    value={newProduct.description}
                    onChange={handleNewProductChange}
                    placeholder="Optional description..."
                    rows={2}
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Plan Details Section */}
          <div className="form-section">
            <h3>Plan Details</h3>
            
            <div className="form-group">
              <label htmlFor="name">Plan Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Weekly Production Batch"
                required
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Optional description..."
                rows={2}
                disabled={isLoading}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="quantityToProduce">Quantity to Produce *</label>
                <input
                  type="number"
                  id="quantityToProduce"
                  name="quantityToProduce"
                  value={formData.quantityToProduce}
                  onChange={handleInputChange}
                  min="0.01"
                  step="0.01"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="estimatedProductionTimeMinutes">Est. Time (minutes) *</label>
                <input
                  type="number"
                  id="estimatedProductionTimeMinutes"
                  name="estimatedProductionTimeMinutes"
                  value={formData.estimatedProductionTimeMinutes}
                  onChange={handleInputChange}
                  min="1"
                  step="1"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="plannedStartDate">Planned Start Date</label>
              <input
                type="date"
                id="plannedStartDate"
                name="plannedStartDate"
                value={formData.plannedStartDate}
                onChange={handleInputChange}
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Optional notes..."
                rows={2}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Required Materials Section */}
          <div className="form-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Required Materials (per unit)</h3>
              {templateLoaded && (
                <span className="template-loaded-badge">
                  ✓ Production template loaded
                </span>
              )}
            </div>
            
            <div className="add-material-section">
              <div className="form-row">
                <div className="form-group" style={{ flex: 2 }}>
                  <label htmlFor="currentMaterial">Select Material</label>
                  <select
                    id="currentMaterial"
                    value={currentMaterial.rawMaterialId}
                    onChange={(e) => setCurrentMaterial(prev => ({ ...prev, rawMaterialId: parseInt(e.target.value) }))}
                    disabled={isLoading}
                  >
                    <option value={0}>-- Select a raw material --</option>
                    {rawMaterials.map(material => (
                      <option key={material.id} value={material.id}>
                        {material.name} ({material.color}) - Available: {material.quantity} {material.quantityType}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="materialQuantity">Quantity</label>
                  <input
                    type="number"
                    id="materialQuantity"
                    value={currentMaterial.requiredQuantity}
                    onChange={(e) => setCurrentMaterial(prev => ({ ...prev, requiredQuantity: parseFloat(e.target.value) || 0 }))}
                    min="0.01"
                    step="0.01"
                    disabled={isLoading}
                  />
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={handleAddMaterial}
                    className="btn btn-secondary"
                    disabled={isLoading}
                  >
                    + Add
                  </button>
                </div>
              </div>
            </div>

            {selectedMaterials.length > 0 && (
              <div className="selected-materials">
                <h4>Selected Materials:</h4>
                <table className="materials-table">
                  <thead>
                    <tr>
                      <th>Material</th>
                      <th>Required (per unit)</th>
                      <th>Total Need</th>
                      <th>Available</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedMaterials.map(material => {
                      const totalNeeded = material.requiredQuantity * formData.quantityToProduce;
                      const isAvailable = material.availableQuantity >= totalNeeded;
                      return (
                        <tr key={material.id} className={!isAvailable ? 'insufficient-stock' : ''}>
                          <td>
                            <div className="material-info">
                              <span className="material-name">{material.materialName}</span>
                              <span className="material-color">({material.materialColor})</span>
                            </div>
                          </td>
                          <td>
                            <input
                              type="number"
                              value={material.requiredQuantity}
                              onChange={(e) => handleUpdateMaterialQuantity(material.id, parseFloat(e.target.value) || 0)}
                              min="0.01"
                              step="0.01"
                              className="quantity-input"
                              disabled={isLoading}
                            />
                            {material.quantityType}
                          </td>
                          <td>{totalNeeded.toFixed(2)} {material.quantityType}</td>
                          <td>{material.availableQuantity.toFixed(2)} {material.quantityType}</td>
                          <td>
                            <span className={`status-badge ${isAvailable ? 'status-available' : 'status-insufficient'}`}>
                              {isAvailable ? '✓ Available' : '⚠ Insufficient'}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => handleRemoveMaterial(material.id)}
                              className="btn btn-sm btn-danger"
                              disabled={isLoading}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Template Update Option */}
          {templateLoaded && hasTemplateChanged() && (
            <div className="template-update-section">
              <div className="template-update-notice">
                <span className="notice-icon">ℹ️</span>
                <div className="notice-content">
                  <strong>Template Changes Detected</strong>
                  <p>You have modified the materials or quantities from the original template.</p>
                </div>
              </div>
              <label className="template-update-checkbox">
                <input
                  type="checkbox"
                  checked={updateTemplate}
                  onChange={(e) => setUpdateTemplate(e.target.checked)}
                  disabled={isLoading}
                />
                <span>Update the product template with these changes</span>
              </label>
            </div>
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
              disabled={isLoading || selectedMaterials.length === 0}
            >
              {isLoading ? 'Creating...' : 'Create Production Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProductionPlan;

