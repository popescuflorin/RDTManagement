import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { productionPlanApi, inventoryApi } from '../../services/api';
import type { 
  ProductionPlan,
  RawMaterial,
  CreateRawMaterialRequest,
  CreateRecyclableProductionPlanRequest
} from '../../types';
import { MaterialType } from '../../types';
import './CreateProductionPlan.css';

interface CreateRecyclableProductionPlanProps {
  onClose: () => void;
  onPlanCreated: (plan: ProductionPlan) => void;
}

interface RecyclableSelection {
  id: string;
  rawMaterialId: number;
  materialName: string;
  materialColor: string;
  quantityType: string;
  requiredQuantity: number;
  availableQuantity: number;
}

const CreateRecyclableProductionPlan: React.FC<CreateRecyclableProductionPlanProps> = ({ onClose, onPlanCreated }) => {
  const { t } = useTranslation(['production', 'common']);
  const [recyclables, setRecyclables] = useState<RawMaterial[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [useNewRawMaterial, setUseNewRawMaterial] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetRawMaterialId: 0,
    quantityToProduce: 1,
    plannedStartDate: new Date().toISOString().split('T')[0],
    estimatedProductionTimeMinutes: 60,
    notes: ''
  });

  const [newRawMaterial, setNewRawMaterial] = useState<CreateRawMaterialRequest>({
    name: '',
    color: '',
    type: MaterialType.RawMaterial,
    quantity: 0,
    quantityType: 'kg',
    minimumStock: 0,
    unitCost: 0,
    description: ''
  });

  const [selectedRecyclables, setSelectedRecyclables] = useState<RecyclableSelection[]>([]);
  const [currentRecyclable, setCurrentRecyclable] = useState({ rawMaterialId: 0, requiredQuantity: 1 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [allMaterials] = await Promise.all([
        inventoryApi.getAllMaterialsIncludingInactive()
      ]);

      const recyclableMats = allMaterials.data.filter((m: RawMaterial) => m.type === MaterialType.RecyclableMaterial && m.isActive);
      const rawMats = allMaterials.data.filter((m: RawMaterial) => m.type === MaterialType.RawMaterial && m.isActive);

      setRecyclables(recyclableMats);
      setRawMaterials(rawMats);
    } catch (err) {
      console.error(err);
      setError(t('createRecyclablePlan.messages.failedToLoadMaterials'));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (name === 'targetRawMaterialId') {
      if (value === 'new') {
        setUseNewRawMaterial(true);
        setFormData(prev => ({ ...prev, targetRawMaterialId: 0 }));
        return;
      } else {
        setUseNewRawMaterial(false);
        const id = parseInt(value) || 0;
        setFormData(prev => ({ ...prev, targetRawMaterialId: id }));
        return;
      }
    }
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
  };

  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    // Prevent number input from changing value when scrolling
    if (e.currentTarget.type === 'number') {
      e.currentTarget.blur();
    }
  };

  const handleNewRawChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setNewRawMaterial(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
  };

  const handleAddRecyclable = () => {
    if (currentRecyclable.rawMaterialId === 0 || currentRecyclable.requiredQuantity <= 0) {
      setError(t('createRecyclablePlan.messages.pleaseSelectRecyclableAndQuantity'));
      return;
    }

    const mat = recyclables.find(m => m.id === currentRecyclable.rawMaterialId);
    if (!mat) return;
    if (selectedRecyclables.some(m => m.rawMaterialId === currentRecyclable.rawMaterialId)) {
      setError(t('createRecyclablePlan.messages.recyclableAlreadyAdded'));
      return;
    }

    const entry: RecyclableSelection = {
      id: Date.now().toString(),
      rawMaterialId: mat.id,
      materialName: mat.name,
      materialColor: mat.color,
      quantityType: mat.quantityType,
      requiredQuantity: currentRecyclable.requiredQuantity,
      availableQuantity: mat.quantity
    };

    setSelectedRecyclables(prev => [...prev, entry]);
    setCurrentRecyclable({ rawMaterialId: 0, requiredQuantity: 1 });
    setError(null);
  };

  const handleRemoveRecyclable = (id: string) => {
    setSelectedRecyclables(prev => prev.filter(m => m.id !== id));
  };

  const handleUpdateRecyclableQty = (id: string, qty: number) => {
    setSelectedRecyclables(prev => prev.map(m => (m.id === id ? { ...m, requiredQuantity: qty } : m)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (selectedRecyclables.length === 0) {
        setError(t('createRecyclablePlan.messages.pleaseAddAtLeastOneRecyclable'));
        setIsLoading(false);
        return;
      }

      const request: CreateRecyclableProductionPlanRequest = {
        name: formData.name,
        description: formData.description || undefined,
        quantityToProduce: formData.quantityToProduce,
        plannedStartDate: formData.plannedStartDate || undefined,
        estimatedProductionTimeMinutes: formData.estimatedProductionTimeMinutes,
        notes: formData.notes || undefined,
        requiredRecyclables: selectedRecyclables.map(m => ({ rawMaterialId: m.rawMaterialId, requiredQuantity: m.requiredQuantity }))
      };

      if (useNewRawMaterial) {
        if (!newRawMaterial.name || !newRawMaterial.color || !newRawMaterial.quantityType) {
          setError(t('createRecyclablePlan.messages.pleaseFillAllRequiredFields'));
          setIsLoading(false);
          return;
        }
        request.newRawMaterial = newRawMaterial;
      } else {
        if (formData.targetRawMaterialId === 0) {
          setError(t('createRecyclablePlan.messages.pleaseSelectOutputRawMaterial'));
          setIsLoading(false);
          return;
        }
        request.targetRawMaterialId = formData.targetRawMaterialId;
      }

      const response = await productionPlanApi.createRecyclablePlan(request);
      onPlanCreated(response.data);
      onClose();
    } catch (err: any) {
      console.error('Error creating recyclable production plan:', err);
      setError(err.response?.data?.message || t('createRecyclablePlan.messages.failedToCreate'));
    } finally {
      setIsLoading(false);
    }
  };

  const commonQuantityTypes = ['pieces', 'kg', 'liters', 'meters', 'grams', 'tons'];

  return (
    <div className="create-production-plan-overlay">
      <div className="create-production-plan-modal">
        <div className="create-production-plan-header">
          <h2>♻️ {t('createRecyclablePlan.title')}</h2>
          <button className="btn btn-sm btn-secondary" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="create-production-plan-form">
          {error && (
            <div className="error-message">{error}</div>
          )}

          {/* Output Raw Material Section */}
          <div className="form-section">
            <h3>{t('createRecyclablePlan.sections.outputRawMaterial')}</h3>
            <div className="form-group">
              <label htmlFor="targetRawMaterialId">{t('createRecyclablePlan.fields.selectRawMaterial')} *</label>
              <select
                id="targetRawMaterialId"
                name="targetRawMaterialId"
                value={useNewRawMaterial ? 'new' : formData.targetRawMaterialId}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              >
                <option value={0}>{t('createRecyclablePlan.fields.selectRawMaterialOption')}</option>
                {rawMaterials.map(material => (
                  <option key={material.id} value={material.id}>
                    {material.name} ({material.color}) - {t('createRecyclablePlan.labels.currentStock')} {material.quantity} {material.quantityType}
                  </option>
                ))}
                <option value="new">{t('createRecyclablePlan.fields.createNewRawMaterial')}</option>
              </select>
            </div>

            {useNewRawMaterial && (
              <div className="new-product-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="newRawName">{t('createRecyclablePlan.fields.name')} *</label>
                    <input id="newRawName" name="name" value={newRawMaterial.name} onChange={handleNewRawChange} required disabled={isLoading} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="newRawColor">{t('createRecyclablePlan.fields.color')} *</label>
                    <input id="newRawColor" name="color" value={newRawMaterial.color} onChange={handleNewRawChange} required disabled={isLoading} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="newRawQtyType">{t('createRecyclablePlan.fields.unitType')} *</label>
                    <input id="newRawQtyType" name="quantityType" value={newRawMaterial.quantityType} onChange={handleNewRawChange} required disabled={isLoading} list="qtyTypes" />
                    <datalist id="qtyTypes">
                      {commonQuantityTypes.map(type => (<option key={type} value={type} />))}
                    </datalist>
                  </div>
                  <div className="form-group">
                    <label htmlFor="newRawMinStock">{t('createRecyclablePlan.fields.minimumStock')}</label>
                    <input type="number" id="newRawMinStock" name="minimumStock" value={newRawMaterial.minimumStock} onChange={handleNewRawChange} onWheel={handleWheel} min={0} step={1} disabled={isLoading} />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="newRawDesc">{t('createRecyclablePlan.fields.description')}</label>
                  <textarea id="newRawDesc" name="description" value={newRawMaterial.description || ''} onChange={handleNewRawChange} rows={2} disabled={isLoading} />
                </div>
              </div>
            )}
          </div>

          {/* Plan Details */}
          <div className="form-section">
            <h3>{t('createRecyclablePlan.sections.planDetails')}</h3>
            <div className="form-group">
              <label htmlFor="name">{t('createRecyclablePlan.fields.planName')} *</label>
              <input id="name" name="name" value={formData.name} onChange={handleInputChange} required disabled={isLoading} placeholder={t('createRecyclablePlan.placeholders.planName')} />
            </div>
            <div className="form-group">
              <label htmlFor="description">{t('createRecyclablePlan.fields.description')}</label>
              <textarea id="description" name="description" value={formData.description} onChange={handleInputChange} rows={2} disabled={isLoading} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="quantityToProduce">{t('createRecyclablePlan.fields.quantityToProduce')} *</label>
                <input type="number" id="quantityToProduce" name="quantityToProduce" value={formData.quantityToProduce} onChange={handleInputChange} onWheel={handleWheel} min={0.01} step={0.01} required disabled={isLoading} />
              </div>
              <div className="form-group">
                <label htmlFor="estimatedProductionTimeMinutes">{t('createRecyclablePlan.fields.estimatedTimeMinutes')} *</label>
                <input type="number" id="estimatedProductionTimeMinutes" name="estimatedProductionTimeMinutes" value={formData.estimatedProductionTimeMinutes} onChange={handleInputChange} onWheel={handleWheel} min={1} step={1} required disabled={isLoading} />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="plannedStartDate">{t('createRecyclablePlan.fields.plannedStartDate')}</label>
              <input type="date" id="plannedStartDate" name="plannedStartDate" value={formData.plannedStartDate} onChange={handleInputChange} disabled={isLoading} />
            </div>
            <div className="form-group">
              <label htmlFor="notes">{t('createRecyclablePlan.fields.notes')}</label>
              <textarea id="notes" name="notes" value={formData.notes} onChange={handleInputChange} rows={2} disabled={isLoading} />
            </div>
          </div>

          {/* Required Recyclables */}
          <div className="form-section">
            <h3>{t('createRecyclablePlan.sections.requiredRecyclables')}</h3>
            <div className="add-material-section">
              <div className="form-row">
                <div className="form-group" style={{ flex: 2 }}>
                  <label htmlFor="currentRecyclable">{t('createRecyclablePlan.fields.selectRecyclable')}</label>
                  <select id="currentRecyclable" value={currentRecyclable.rawMaterialId} onChange={(e) => setCurrentRecyclable(prev => ({ ...prev, rawMaterialId: parseInt(e.target.value) }))} disabled={isLoading}>
                    <option value={0}>{t('createRecyclablePlan.fields.selectRecyclableOption')}</option>
                    {recyclables.map(mat => (
                      <option key={mat.id} value={mat.id}>
                        {mat.name} ({mat.color}) - {t('createRecyclablePlan.labels.available')} {mat.quantity} {mat.quantityType}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="recyclableQty">{t('createRecyclablePlan.fields.quantity')}</label>
                  <input type="number" id="recyclableQty" value={currentRecyclable.requiredQuantity} onChange={(e) => setCurrentRecyclable(prev => ({ ...prev, requiredQuantity: parseFloat(e.target.value) || 0 }))} onWheel={handleWheel} min={0.01} step={0.01} disabled={isLoading} />
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button type="button" onClick={handleAddRecyclable} className="btn btn-secondary" disabled={isLoading}>{t('createRecyclablePlan.buttons.add')}</button>
                </div>
              </div>
            </div>

            {selectedRecyclables.length > 0 && (
              <div className="selected-materials">
                <h4>{t('createRecyclablePlan.labels.selectedRecyclables')}</h4>
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
                    {selectedRecyclables.map(m => {
                      const totalNeeded = m.requiredQuantity * formData.quantityToProduce;
                      const isAvailable = m.availableQuantity >= totalNeeded;
                      return (
                        <tr key={m.id} className={!isAvailable ? 'insufficient-stock' : ''}>
                          <td>
                            <div className="material-info">
                              <span className="material-name">{m.materialName}</span>
                              <span className="material-color">({m.materialColor})</span>
                            </div>
                          </td>
                          <td>
                            <input type="number" value={m.requiredQuantity} onChange={(e) => handleUpdateRecyclableQty(m.id, parseFloat(e.target.value) || 0)} onWheel={handleWheel} min={0.01} step={0.01} className="quantity-input" disabled={isLoading} />
                            {m.quantityType}
                          </td>
                          <td>{totalNeeded.toFixed(2)} {m.quantityType}</td>
                          <td>{m.availableQuantity.toFixed(2)} {m.quantityType}</td>
                          <td>
                            <span className={`status-badge ${isAvailable ? 'status-available' : 'status-insufficient'}`}>
                              {isAvailable ? t('createPlan.status.available') : t('createPlan.status.insufficient')}
                            </span>
                          </td>
                          <td>
                            <button type="button" onClick={() => handleRemoveRecyclable(m.id)} className="btn btn-sm btn-danger" disabled={isLoading}>{t('createRecyclablePlan.buttons.remove')}</button>
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
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isLoading}>{t('createRecyclablePlan.buttons.cancel')}</button>
            <button type="submit" className="btn btn-primary" disabled={isLoading || selectedRecyclables.length === 0}>
              {isLoading ? t('createRecyclablePlan.buttons.creating') : t('createRecyclablePlan.buttons.createRecyclablesPlan')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRecyclableProductionPlan;


