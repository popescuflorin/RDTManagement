import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Truck, 
  Package, 
  CheckCircle, 
  Clock,
  X,
  Plus,
  Trash2
} from 'lucide-react';
import { productionPlanApi, inventoryApi } from '../../services/api';
import type { CreateRawMaterialRequest, ProductionPlan, RawMaterial } from '../../types';
import { ProductionPlanStatus, MaterialType } from '../../types';
import './ReceiveProduction.css';

interface ReceiveProductionProps {
  plan: ProductionPlan;
  onClose: () => void;
  onPlanReceived: (updatedPlan: ProductionPlan) => void;
}

interface ProducedMaterial {
  id: string;
  materialId: number;
  materialName: string;
  materialColor: string;
  materialType: MaterialType;
  quantityType: string;
  quantity: number;
}

const ReceiveProduction: React.FC<ReceiveProductionProps> = ({ plan, onClose, onPlanReceived }) => {
  const { t } = useTranslation(['production', 'common']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actualQuantityProduced, setActualQuantityProduced] = useState(plan.quantityToProduce);
  const [actualProductionTimeMinutes, setActualProductionTimeMinutes] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [availableMaterials, setAvailableMaterials] = useState<RawMaterial[]>([]);
  const [producedMaterials, setProducedMaterials] = useState<ProducedMaterial[]>([]);
  const [currentMaterial, setCurrentMaterial] = useState({
    materialId: 0,
    quantity: 1
  });
  const [isAddingToInventory, setIsAddingToInventory] = useState(false);
  const [inventoryUpdateStatus, setInventoryUpdateStatus] = useState<string>('');
  const [materialMode, setMaterialMode] = useState<'existing' | 'new'>('existing');
  const [newMaterialData, setNewMaterialData] = useState({
    name: '',
    color: '',
    type: MaterialType.RawMaterial,
    quantityType: '',
    description: ''
  });
  const [useProducedMaterials, setUseProducedMaterials] = useState(false);

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      const response = await inventoryApi.getAllMaterialsIncludingInactive();
      const materials = response.data.filter(
        (m: RawMaterial) => m.isActive && (m.type === MaterialType.RawMaterial || m.type === MaterialType.RecyclableMaterial || m.type === MaterialType.FinishedProduct)
      );
      setAvailableMaterials(materials);
    } catch (error: any) {
      console.error('Error loading materials:', error);
      setError(t('receiveProduction.messages.failedToLoadMaterials'));
    }
  };


  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    // Prevent number input from changing value when scrolling
    if (e.currentTarget.type === 'number') {
      e.currentTarget.blur();
    }
  };

  const handleAddProducedMaterial = async () => {
    if (materialMode === 'existing') {
      if (currentMaterial.materialId === 0 || currentMaterial.quantity <= 0) {
        setError(t('receiveProduction.messages.pleaseSelectMaterialAndQuantity'));
        return;
      }

      const material = availableMaterials.find(m => m.id === currentMaterial.materialId);
      if (!material) return;

      // Check if material already added
      if (producedMaterials.some(m => m.materialId === currentMaterial.materialId)) {
        setError(t('receiveProduction.messages.materialAlreadyAdded'));
        return;
      }

      const newProducedMaterial: ProducedMaterial = {
        id: Date.now().toString(),
        materialId: material.id,
        materialName: material.name,
        materialColor: material.color,
        materialType: material.type,
        quantityType: material.quantityType,
        quantity: currentMaterial.quantity
      };

      setProducedMaterials(prev => [...prev, newProducedMaterial]);
      setCurrentMaterial({ materialId: 0, quantity: 1 });
      setError(null);
    } else {
      // Create new material
      if (!newMaterialData.name || !newMaterialData.color || !newMaterialData.quantityType || currentMaterial.quantity <= 0) {
        setError(t('receiveProduction.messages.pleaseFillAllMaterialDetails'));
        return;
      }

      // Validate that name, color, and quantityType are not just whitespace
      if (newMaterialData.name.trim() === '' || newMaterialData.color.trim() === '' || newMaterialData.quantityType.trim() === '') {
        setError(t('receiveProduction.messages.nameColorQuantityTypeCannotBeEmpty'));
        return;
      }

      try {
        const createMaterialRequest : CreateRawMaterialRequest = {
          name: newMaterialData.name.trim(),
          color: newMaterialData.color.trim(),
          type: newMaterialData.type, // Ensure type is sent as number
          quantity: currentMaterial.quantity,
          quantityType: newMaterialData.quantityType.trim(),
          minimumStock: 0,
          unitCost: 0,
          description: newMaterialData.description?.trim() || ''
        };

        console.log('Creating material with request:', createMaterialRequest);
        const response = await inventoryApi.createMaterial(createMaterialRequest);
        const createdMaterial = response.data;

        const newProducedMaterial: ProducedMaterial = {
          id: Date.now().toString(),
          materialId: createdMaterial.id,
          materialName: createdMaterial.name,
          materialColor: createdMaterial.color,
          materialType: createdMaterial.type,
          quantityType: createdMaterial.quantityType,
          quantity: currentMaterial.quantity
        };

        setProducedMaterials(prev => [...prev, newProducedMaterial]);
        setCurrentMaterial({ materialId: 0, quantity: 1 });
        setNewMaterialData({
          name: '',
          color: '',
          type: MaterialType.RawMaterial,
          quantityType: '',
          description: ''
        });
        setError(null);

        // Refresh available materials list
        await loadMaterials();
      } catch (error: any) {
        console.error('Error creating material:', error);
        console.error('Error response:', error.response?.data);
        setError(error.response?.data?.message || error.response?.data?.title || t('receiveProduction.messages.failedToCreateMaterial'));
      }
    }
  };

  const handleRemoveProducedMaterial = (id: string) => {
    setProducedMaterials(prev => prev.filter(m => m.id !== id));
  };

  const handleUpdateProducedMaterialQuantity = (id: string, quantity: number) => {
    setProducedMaterials(prev => 
      prev.map(m => m.id === id ? { ...m, quantity } : m)
    );
  };

  const handleNewMaterialChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setNewMaterialData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (actualQuantityProduced <= 0) {
        setError(t('receiveProduction.messages.actualQuantityMustBeGreaterThanZero'));
        setIsLoading(false);
        return;
      }

      if (useProducedMaterials && producedMaterials.length === 0) {
        setError(t('receiveProduction.messages.pleaseAddAtLeastOneProducedMaterial'));
        setIsLoading(false);
        return;
      }

      await productionPlanApi.executePlan(plan.id, {
        actualQuantityProduced,
        actualProductionTimeMinutes: actualProductionTimeMinutes || undefined,
        notes: notes || undefined
      });

      // Add produced materials to inventory (only if specified)
      if (useProducedMaterials && producedMaterials.length > 0) {
        setIsAddingToInventory(true);
        setInventoryUpdateStatus(t('receiveProduction.messages.addingMaterialsToInventory'));
        
        const inventoryResults = [];
        for (const producedMaterial of producedMaterials) {
          try {
            setInventoryUpdateStatus(t('receiveProduction.messages.addingMaterialToInventory', { materialName: producedMaterial.materialName }));
            await inventoryApi.addToExisting({
              materialId: producedMaterial.materialId,
              quantityToAdd: producedMaterial.quantity
            });
            inventoryResults.push({ material: producedMaterial.materialName, success: true });
          } catch (materialError: any) {
            console.error(`Error adding ${producedMaterial.materialName} to inventory:`, materialError);
            inventoryResults.push({ 
              material: producedMaterial.materialName, 
              success: false, 
              error: materialError.response?.data?.message || 'Failed to add to inventory'
            });
          }
        }
        
        setIsAddingToInventory(false);
        
        // Show summary of inventory updates
        const successful = inventoryResults.filter(r => r.success).length;
        const failed = inventoryResults.filter(r => !r.success).length;
        
        if (failed === 0) {
          setInventoryUpdateStatus(t('receiveProduction.messages.successfullyAddedMaterials', { count: successful }));
        } else {
          setInventoryUpdateStatus(t('receiveProduction.messages.addedMaterialsSuccessfullyFailed', { successful, failed }));
        }
      } else {
        setInventoryUpdateStatus(t('receiveProduction.messages.productionCompletedUsingPlannedMaterials'));
      }

      // Create an updated plan object with Completed status
      const updatedPlan: ProductionPlan = {
        ...plan,
        status: ProductionPlanStatus.Completed,
        completedAt: new Date().toISOString()
      };

      onPlanReceived(updatedPlan);
      onClose();
    } catch (error: any) {
      console.error('Error completing production:', error);
      const errorMessage = error.response?.data?.message || t('receiveProduction.messages.failedToComplete');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusInfo = (status: ProductionPlanStatus) => {
    switch (status) {
      case ProductionPlanStatus.InProgress:
        return { label: t('receiveProduction.status.inProgress'), color: 'status-in-progress', icon: Clock };
      default:
        return { label: t('receiveProduction.status.unknown'), color: 'status-draft', icon: Package };
    }
  };

  const statusInfo = getStatusInfo(plan.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="receive-production-overlay">
      <div className="receive-production-modal" onClick={(e) => e.stopPropagation()}>
        <div className="receive-production-header">
          <div className="header-content">
            <div className="header-title">
              <Truck className="header-icon" />
              <h2>{t('receiveProduction.title')}</h2>
            </div>
            <button className="close-button" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
          <div className="header-status">
            <div className={`status-badge ${statusInfo.color}`}>
              <StatusIcon size={16} />
              <span>{statusInfo.label}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="receive-production-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {inventoryUpdateStatus && (
            <div className={`status-message ${isAddingToInventory ? 'status-loading' : 'status-success'}`}>
              {isAddingToInventory && <div className="loading-spinner"></div>}
              {inventoryUpdateStatus}
            </div>
          )}

          {/* Plan Overview Section */}
          <div className="form-section">
            <div className="section-header">
              <Package className="section-icon" />
              <h3>{t('receiveProduction.sections.productionPlanOverview')}</h3>
            </div>
            
            <div className="info-grid">
              <div className="info-item">
                <label>{t('receiveProduction.fields.planName')}</label>
                <div className="info-value">{plan.name}</div>
              </div>
              
              <div className="info-item">
                <label>{t('receiveProduction.fields.targetProduct')}</label>
                <div className="info-value">
                  <div className="product-info">
                    <span className="product-name">{plan.targetProductName}</span>
                    <span className="product-color">({plan.targetProductColor})</span>
                  </div>
                </div>
              </div>
              
              <div className="info-item">
                <label>{t('receiveProduction.fields.startedAt')}</label>
                <div className="info-value">
                  {plan.startedAt ? formatDateTime(plan.startedAt) : t('receiveProduction.labels.notStarted')}
                </div>
              </div>
              
              <div className="info-item">
                <label>{t('receiveProduction.fields.materialsRequired')}</label>
                <div className="info-value">{plan.requiredMaterials.length} {t('receiveProduction.labels.materials')}</div>
              </div>
            </div>
          </div>

          {/* Production Results Section */}
          <div className="form-section">
            <div className="section-header">
              <CheckCircle className="section-icon" />
              <h3>{t('receiveProduction.sections.finalProductionResults')}</h3>
            </div>
            
            <div className="form-group">
              <label htmlFor="actualQuantityProduced">{t('receiveProduction.fields.actualQuantityProduced')} *</label>
              <input
                type="number"
                id="actualQuantityProduced"
                value={actualQuantityProduced}
                onChange={(e) => setActualQuantityProduced(parseFloat(e.target.value) || 0)}
                onWheel={handleWheel}
                min="0.01"
                step="0.01"
                required
                disabled={isLoading}
                placeholder={t('receiveProduction.placeholders.actualQuantityProduced')}
              />
              <div className="input-help">
                {t('receiveProduction.labels.plannedQuantity')} {plan.quantityToProduce} {t('receiveProduction.labels.units')}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="actualProductionTimeMinutes">{t('receiveProduction.fields.actualProductionTimeMinutes')}</label>
              <input
                type="number"
                id="actualProductionTimeMinutes"
                value={actualProductionTimeMinutes}
                onChange={(e) => setActualProductionTimeMinutes(parseInt(e.target.value) || 0)}
                onWheel={handleWheel}
                min="0"
                step="1"
                disabled={isLoading}
                placeholder={t('receiveProduction.placeholders.actualProductionTime')}
              />
              <div className="input-help">
                {t('receiveProduction.labels.optionalRecordTime')}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="notes">{t('receiveProduction.fields.productionNotes')}</label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                disabled={isLoading}
                placeholder={t('receiveProduction.placeholders.productionNotes')}
              />
            </div>
          </div>

          {/* Produced Materials Section */}
          <div className="form-section">
            <div className="section-header">
              <Package className="section-icon" />
              <h3>{t('receiveProduction.sections.materialsProduced')}</h3>
              <div className="section-toggle">
                <label className="toggle-checkbox">
                  <input
                    type="checkbox"
                    checked={useProducedMaterials}
                    onChange={(e) => setUseProducedMaterials(e.target.checked)}
                    disabled={isLoading}
                  />
                  <span className="toggle-label">{t('receiveProduction.labels.specifyProducedMaterials')}</span>
                </label>
                <div className="toggle-help">
                  {useProducedMaterials 
                    ? t('receiveProduction.labels.addSpecificMaterials')
                    : t('receiveProduction.labels.usePlannedMaterials')
                  }
                </div>
              </div>
            </div>
            
            {useProducedMaterials && (
              <div className="add-material-section">
              {/* Mode Selector */}
              <div className="mode-selector">
                <button 
                  type="button"
                  className={`mode-button ${materialMode === 'existing' ? 'active' : ''}`}
                  onClick={() => setMaterialMode('existing')}
                  disabled={isLoading}
                >
                  {t('receiveProduction.labels.selectExistingMaterial')}
                </button>
                <button 
                  type="button"
                  className={`mode-button ${materialMode === 'new' ? 'active' : ''}`}
                  onClick={() => setMaterialMode('new')}
                  disabled={isLoading}
                >
                  {t('receiveProduction.labels.createNewMaterial')}
                </button>
              </div>

              {materialMode === 'existing' ? (
                <div className="form-row">
                  <div className="form-group" style={{ flex: 2 }}>
                    <label htmlFor="currentMaterial">{t('receiveProduction.fields.selectProducedMaterial')}</label>
                    <select
                      id="currentMaterial"
                      value={currentMaterial.materialId}
                      onChange={(e) => setCurrentMaterial(prev => ({ ...prev, materialId: parseInt(e.target.value) }))}
                      disabled={isLoading}
                    >
                      <option value={0}>{t('receiveProduction.fields.selectMaterial')}</option>
                      {availableMaterials.map(material => (
                        <option key={material.id} value={material.id}>
                          {material.name} ({material.color}) - {material.quantityType}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="materialQuantity">{t('receiveProduction.fields.quantityProduced')}</label>
                    <input
                      type="number"
                      id="materialQuantity"
                      value={currentMaterial.quantity}
                      onChange={(e) => setCurrentMaterial(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                      onWheel={handleWheel}
                      min="0.01"
                      step="0.01"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={handleAddProducedMaterial}
                      className="btn btn-secondary"
                      disabled={isLoading}
                    >
                      <Plus size={16} />
                      {t('receiveProduction.buttons.add')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="new-material-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="newMaterialName">{t('receiveProduction.fields.materialName')} *</label>
                      <input
                        type="text"
                        id="newMaterialName"
                        name="name"
                        value={newMaterialData.name}
                        onChange={handleNewMaterialChange}
                        placeholder={t('receiveProduction.placeholders.materialName')}
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="newMaterialColor">{t('receiveProduction.fields.color')} *</label>
                      <input
                        type="text"
                        id="newMaterialColor"
                        name="color"
                        value={newMaterialData.color}
                        onChange={handleNewMaterialChange}
                        placeholder={t('receiveProduction.placeholders.color')}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="newMaterialType">{t('receiveProduction.fields.materialType')} *</label>
                      <select
                        id="newMaterialType"
                        name="type"
                        value={newMaterialData.type}
                        onChange={handleNewMaterialChange}
                        required
                        disabled={isLoading}
                      >
                        <option value={MaterialType.RawMaterial}>{t('receiveProduction.labels.rawMaterial')}</option>
                        <option value={MaterialType.RecyclableMaterial}>{t('receiveProduction.labels.recyclableMaterial')}</option>
                        <option value={MaterialType.FinishedProduct}>{t('receiveProduction.labels.finishedProduct')}</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="newMaterialQuantityType">{t('receiveProduction.fields.unitType')} *</label>
                      <input
                        type="text"
                        id="newMaterialQuantityType"
                        name="quantityType"
                        value={newMaterialData.quantityType}
                        onChange={handleNewMaterialChange}
                        placeholder={t('receiveProduction.placeholders.unitType')}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="newMaterialQuantity">{t('receiveProduction.fields.quantityProduced')} *</label>
                      <input
                        type="number"
                        id="newMaterialQuantity"
                        value={currentMaterial.quantity}
                        onChange={(e) => setCurrentMaterial(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                        onWheel={handleWheel}
                        min="0.01"
                        step="0.01"
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={handleAddProducedMaterial}
                        className="btn btn-primary"
                        disabled={isLoading}
                      >
                        <Plus size={16} />
                        {t('receiveProduction.buttons.createAndAdd')}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="newMaterialDescription">{t('receiveProduction.fields.description')}</label>
                    <textarea
                      id="newMaterialDescription"
                      name="description"
                      value={newMaterialData.description}
                      onChange={handleNewMaterialChange}
                      placeholder={t('receiveProduction.placeholders.description')}
                      rows={2}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              )}
              </div>
            )}

            {useProducedMaterials && producedMaterials.length > 0 && (
              <div className="produced-materials">
                <h4>{t('receiveProduction.fields.producedMaterials')}</h4>
                <table className="materials-table">
                  <thead>
                    <tr>
                      <th>{t('receiveProduction.fields.material')}</th>
                      <th>{t('receiveProduction.fields.type')}</th>
                      <th>{t('receiveProduction.fields.quantity')}</th>
                      <th>{t('common:table.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {producedMaterials.map(material => (
                      <tr key={material.id}>
                        <td>
                          <div className="material-info">
                            <span className="material-name">{material.materialName}</span>
                            <span className="material-color">({material.materialColor})</span>
                          </div>
                        </td>
                        <td>
                          <span className={`material-type-badge ${material.materialType === MaterialType.RawMaterial ? 'raw-material' : 
                            material.materialType === MaterialType.RecyclableMaterial ? 'recyclable-material' : 'finished-product'}`}>
                            {material.materialType === MaterialType.RawMaterial ? t('receiveProduction.labels.rawMaterial') : 
                             material.materialType === MaterialType.RecyclableMaterial ? t('receiveProduction.labels.recyclableMaterial') : t('receiveProduction.labels.finishedProduct')}
                          </span>
                        </td>
                        <td>
                          <input
                            type="number"
                            value={material.quantity}
                            onChange={(e) => handleUpdateProducedMaterialQuantity(material.id, parseFloat(e.target.value) || 0)}
                            onWheel={handleWheel}
                            min="0.01"
                            step="0.01"
                            className="quantity-input"
                            disabled={isLoading}
                          />
                          {material.quantityType}
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleRemoveProducedMaterial(material.id)}
                            className="btn btn-sm btn-danger"
                            disabled={isLoading}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Materials Summary */}
          <div className="form-section">
            <div className="section-header">
              <Package className="section-icon" />
              <h3>{t('receiveProduction.sections.materialsUsed')}</h3>
            </div>
            
            <div className="materials-summary">
              <table className="materials-table">
                <thead>
                  <tr>
                    <th>{t('receiveProduction.fields.material')}</th>
                    <th>{t('receiveProduction.fields.requiredPerUnit')}</th>
                    <th>{t('receiveProduction.fields.totalUsed')}</th>
                    <th>{t('receiveProduction.fields.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.requiredMaterials.map((material, index) => {
                    const totalUsed = material.requiredQuantity * actualQuantityProduced;
                    const isAvailable = material.availableQuantity >= totalUsed;
                    
                    return (
                      <tr key={index} className={!isAvailable ? 'insufficient-stock' : ''}>
                        <td>
                          <div className="material-info">
                            <span className="material-name">{material.materialName}</span>
                            <span className="material-color">({material.materialColor})</span>
                          </div>
                        </td>
                        <td>{material.requiredQuantity} {material.quantityType}</td>
                        <td>{totalUsed.toFixed(2)} {material.quantityType}</td>
                        <td>
                          <div className={`availability-badge ${isAvailable ? 'available' : 'unavailable'}`}>
                            {isAvailable ? (
                              <>
                                <CheckCircle size={14} />
                                <span>{t('receiveProduction.labels.available')}</span>
                              </>
                            ) : (
                              <>
                                <span>{t('receiveProduction.labels.insufficient')}</span>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={isLoading}
            >
              {t('receiveProduction.buttons.cancel')}
            </button>
            <button
              type="submit"
              className="btn btn-success"
              disabled={isLoading || actualQuantityProduced <= 0 || isAddingToInventory}
            >
              {isLoading ? t('receiveProduction.buttons.completing') : isAddingToInventory ? t('receiveProduction.buttons.addingToInventory') : t('receiveProduction.buttons.completeProduction')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReceiveProduction;
