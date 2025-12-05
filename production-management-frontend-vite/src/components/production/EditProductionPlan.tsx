import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { productionPlanApi, inventoryApi } from '../../services/api';
import type { 
  ProductionPlan, 
  RawMaterial,
  UpdateProductionPlanRequest,
  CreateProductionPlanMaterialRequest 
} from '../../types';
import { MaterialType } from '../../types';
import './EditProductionPlan.css';

interface EditProductionPlanProps {
  plan: ProductionPlan;
  onClose: () => void;
  onPlanUpdated: (updatedPlan: ProductionPlan) => void;
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

const EditProductionPlan: React.FC<EditProductionPlanProps> = ({ plan, onClose, onPlanUpdated }) => {
  const { t } = useTranslation(['production', 'common']);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [materialsError, setMaterialsError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: plan.name,
    description: plan.description || '',
    quantityToProduce: plan.quantityToProduce,
    plannedStartDate: plan.plannedStartDate || '',
    estimatedProductionTimeMinutes: plan.estimatedProductionTimeMinutes,
    notes: plan.notes || ''
  });

  const [selectedMaterials, setSelectedMaterials] = useState<MaterialSelection[]>([]);
  const [currentMaterial, setCurrentMaterial] = useState({
    rawMaterialId: 0,
    requiredQuantity: 1
  });

  useEffect(() => {
    loadData();
    initializeMaterials();
  }, [plan]);

  const loadData = async () => {
    try {
      const rawMaterialsResponse = await inventoryApi.getAllMaterialsIncludingInactive();
      const rawMats = rawMaterialsResponse.data.filter(
        (m: RawMaterial) => m.type === MaterialType.RawMaterial && m.isActive
      );
      setRawMaterials(rawMats);
    } catch (error: any) {
      console.error('Error loading data:', error);
      setError(t('editPlan.messages.failedToLoadMaterials'));
    }
  };

  const initializeMaterials = () => {
    const materials: MaterialSelection[] = plan.requiredMaterials.map(m => ({
      id: Date.now().toString() + '-' + m.rawMaterialId,
      rawMaterialId: m.rawMaterialId,
      materialName: m.materialName,
      materialColor: m.materialColor,
      quantityType: m.quantityType,
      requiredQuantity: m.requiredQuantity,
      availableQuantity: m.availableQuantity,
      unitCost: m.estimatedUnitCost
    }));
    setSelectedMaterials(materials);
  };

  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    // Prevent number input from changing value when scrolling
    if (e.currentTarget.type === 'number') {
      e.currentTarget.blur();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleAddMaterial = () => {
    if (currentMaterial.rawMaterialId === 0 || currentMaterial.requiredQuantity <= 0) {
      setMaterialsError(t('editPlan.messages.pleaseSelectMaterialAndQuantity'));
      return;
    }

    const material = rawMaterials.find(m => m.id === currentMaterial.rawMaterialId);
    if (!material) return;

    // Check if material already added
    if (selectedMaterials.some(m => m.rawMaterialId === currentMaterial.rawMaterialId)) {
      setMaterialsError(t('editPlan.messages.materialAlreadyAdded'));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (selectedMaterials.length === 0) {
        setMaterialsError(t('editPlan.messages.pleaseAddAtLeastOneMaterial'));
        setIsLoading(false);
        return;
      }

      const requiredMaterials: CreateProductionPlanMaterialRequest[] = selectedMaterials.map(m => ({
        rawMaterialId: m.rawMaterialId,
        requiredQuantity: m.requiredQuantity
      }));

      const request: UpdateProductionPlanRequest = {
        name: formData.name,
        description: formData.description,
        quantityToProduce: formData.quantityToProduce,
        plannedStartDate: formData.plannedStartDate || undefined,
        estimatedProductionTimeMinutes: formData.estimatedProductionTimeMinutes,
        notes: formData.notes || undefined,
        requiredMaterials
      };

      const response = await productionPlanApi.updatePlan(plan.id, request);
      onPlanUpdated(response.data);
      onClose();
    } catch (error: any) {
      console.error('Error updating production plan:', error);
      const errorMessage = error.response?.data?.message || t('editPlan.messages.failedToUpdate');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="edit-production-plan-overlay">
      <div className="edit-production-plan-modal">
        <div className="edit-production-plan-header">
          <h2>✏️ {t('editPlan.title')}</h2>
          <button className="btn btn-sm btn-secondary" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="edit-production-plan-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

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
            <h3>{t('createPlan.sections.requiredMaterials')}</h3>

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
              {isLoading ? t('editPlan.buttons.updating') : t('editPlan.buttons.updateProductionPlan')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProductionPlan;
