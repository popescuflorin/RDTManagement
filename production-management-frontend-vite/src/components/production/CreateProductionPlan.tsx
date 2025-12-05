import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation(['production', 'common']);
  const [finishedProducts, setFinishedProducts] = useState<RawMaterial[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [materialsError, setMaterialsError] = useState<string | null>(null);
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
      setError(t('createPlan.messages.failedToLoadMaterials'));
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    // Prevent number input from changing value when scrolling
    if (e.currentTarget.type === 'number') {
      e.currentTarget.blur();
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
      setMaterialsError(t('createPlan.messages.pleaseSelectMaterialAndQuantity'));
      return;
    }

    const material = rawMaterials.find(m => m.id === currentMaterial.rawMaterialId);
    if (!material) return;

    // Check if material already added
    if (selectedMaterials.some(m => m.rawMaterialId === currentMaterial.rawMaterialId)) {
      setMaterialsError(t('createPlan.messages.materialAlreadyAdded'));
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
    setMaterialsError(null);
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
        setMaterialsError(t('createPlan.messages.pleaseAddAtLeastOneMaterial'));
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
          setError(t('createPlan.messages.pleaseFillAllRequiredFields'));
          setIsLoading(false);
          return;
        }
        request.newFinishedProduct = newProduct;
      } else {
        // Using existing product
        if (formData.targetProductId === 0) {
          setError(t('createPlan.messages.pleaseSelectFinishedProduct'));
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
      const errorMessage = error.response?.data?.message || t('createPlan.messages.failedToCreate');
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
          <h2>📋 {t('createPlan.title')}</h2>
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
            <h3>{t('createPlan.sections.targetProduct')}</h3>
            
            <div className="form-group">
              <label htmlFor="targetProductId">{t('createPlan.fields.selectFinishedProduct')} *</label>
              <select
                id="targetProductId"
                name="targetProductId"
                value={showNewProductForm ? 'new' : formData.targetProductId}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              >
                <option value={0}>{t('createPlan.fields.selectProduct')}</option>
                {finishedProducts.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.color}) - {t('createPlan.labels.currentStock')} {product.quantity} {product.quantityType}
                  </option>
                ))}
                <option value="new">{t('createPlan.fields.createNewProduct')}</option>
              </select>
            </div>

            {/* New Product Form - shown when "Create New Product" is selected */}
            {showNewProductForm && (
              <div className="new-product-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="newProductName">{t('createPlan.fields.productName')} *</label>
                    <input
                      type="text"
                      id="newProductName"
                      name="name"
                      value={newProduct.name}
                      onChange={handleNewProductChange}
                      placeholder={t('createPlan.placeholders.productName')}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="newProductColor">{t('createPlan.fields.color')} *</label>
                    <input
                      type="text"
                      id="newProductColor"
                      name="color"
                      value={newProduct.color}
                      onChange={handleNewProductChange}
                      placeholder={t('createPlan.placeholders.color')}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="newProductQuantityType">{t('createPlan.fields.unitType')} *</label>
                    <input
                      type="text"
                      id="newProductQuantityType"
                      name="quantityType"
                      value={newProduct.quantityType}
                      onChange={handleNewProductChange}
                      placeholder={t('createPlan.placeholders.unitType')}
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
                    <label htmlFor="newProductMinimumStock">{t('createPlan.fields.minimumStock')}</label>
                    <input
                      type="number"
                      id="newProductMinimumStock"
                      name="minimumStock"
                      value={newProduct.minimumStock}
                      onChange={handleNewProductChange}
                      onWheel={handleWheel}
                      min="0"
                      step="1"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="newProductDescription">{t('createPlan.fields.description')}</label>
                  <textarea
                    id="newProductDescription"
                    name="description"
                    value={newProduct.description}
                    onChange={handleNewProductChange}
                    placeholder={t('createPlan.placeholders.description')}
                    rows={2}
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Plan Details Section */}
          <div className="form-section">
            <h3>{t('createPlan.sections.planDetails')}</h3>
            
            <div className="form-group">
              <label htmlFor="name">{t('createPlan.fields.planName')} *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder={t('createPlan.placeholders.planName')}
                required
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">{t('createPlan.fields.description')}</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder={t('createPlan.placeholders.description')}
                rows={2}
                disabled={isLoading}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="quantityToProduce">{t('createPlan.fields.quantityToProduce')} *</label>
                <input
                  type="number"
                  id="quantityToProduce"
                  name="quantityToProduce"
                  value={formData.quantityToProduce}
                  onChange={handleInputChange}
                  onWheel={handleWheel}
                  min="0.01"
                  step="0.01"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="estimatedProductionTimeMinutes">{t('createPlan.fields.estimatedTimeMinutes')} *</label>
                <input
                  type="number"
                  id="estimatedProductionTimeMinutes"
                  name="estimatedProductionTimeMinutes"
                  value={formData.estimatedProductionTimeMinutes}
                  onChange={handleInputChange}
                  onWheel={handleWheel}
                  min="1"
                  step="1"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="plannedStartDate">{t('createPlan.fields.plannedStartDate')}</label>
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
              <label htmlFor="notes">{t('createPlan.fields.notes')}</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder={t('createPlan.placeholders.notes')}
                rows={2}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Required Materials Section */}
          <div className="form-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>{t('createPlan.sections.requiredMaterials')}</h3>
              {templateLoaded && (
                <span className="template-loaded-badge">
                  {t('createPlan.labels.templateLoaded')}
                </span>
              )}
            </div>

            {/* Materials Error Message */}
            {materialsError && (
              <div className="error-message">
                {materialsError}
                <button onClick={() => setMaterialsError(null)} style={{ marginLeft: '10px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>×</button>
              </div>
            )}
            
            <div className="add-material-section">
              <div className="form-row">
                <div className="form-group" style={{ flex: 2 }}>
                  <label htmlFor="currentMaterial">{t('createPlan.fields.selectMaterial')}</label>
                  <select
                    id="currentMaterial"
                    value={currentMaterial.rawMaterialId}
                    onChange={(e) => setCurrentMaterial(prev => ({ ...prev, rawMaterialId: parseInt(e.target.value) }))}
                    disabled={isLoading}
                  >
                    <option value={0}>{t('createPlan.fields.selectRawMaterial')}</option>
                    {rawMaterials.map(material => (
                      <option key={material.id} value={material.id}>
                        {material.name} ({material.color}) - {t('createPlan.labels.available')} {material.quantity} {material.quantityType}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="materialQuantity">{t('createPlan.fields.quantity')}</label>
                  <input
                    type="number"
                    id="materialQuantity"
                    value={currentMaterial.requiredQuantity}
                    onChange={(e) => setCurrentMaterial(prev => ({ ...prev, requiredQuantity: parseFloat(e.target.value) || 0 }))}
                    onWheel={handleWheel}
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
                    {t('createPlan.buttons.add')}
                  </button>
                </div>
              </div>
            </div>

            {selectedMaterials.length > 0 && (
              <div className="selected-materials">
                <h4>{t('createPlan.labels.selectedMaterials')}</h4>
                <table className="materials-table">
                  <thead>
                    <tr>
                      <th>{t('createPlan.table.material')}</th>
                      <th>{t('createPlan.table.requiredPerUnit')}</th>
                      <th>{t('createPlan.table.totalNeed')}</th>
                      <th>{t('createPlan.table.available')}</th>
                      <th>{t('createPlan.table.status')}</th>
                      <th>{t('createPlan.table.actions')}</th>
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
                              onWheel={handleWheel}
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
                              {isAvailable ? t('createPlan.status.available') : t('createPlan.status.insufficient')}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => handleRemoveMaterial(material.id)}
                              className="btn btn-sm btn-danger"
                              disabled={isLoading}
                            >
                              {t('createPlan.buttons.remove')}
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
                  <strong>{t('createPlan.labels.templateChangesDetected')}</strong>
                  <p>{t('createPlan.labels.templateChangesDescription')}</p>
                </div>
              </div>
              <label className="template-update-checkbox">
                <input
                  type="checkbox"
                  checked={updateTemplate}
                  onChange={(e) => setUpdateTemplate(e.target.checked)}
                  disabled={isLoading}
                />
                <span>{t('createPlan.labels.updateTemplate')}</span>
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
              {t('createPlan.buttons.cancel')}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || selectedMaterials.length === 0}
            >
              {isLoading ? t('createPlan.buttons.creating') : t('createPlan.buttons.createProductionPlan')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProductionPlan;

