import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Plus, Trash2 } from 'lucide-react';
import * as types from '../../types';
import { inventoryApi, productionPlanApi } from '../../services/api';
import './EditProductionPlan.css';

interface EditRecyclableProductionPlanProps {
  plan: types.RecyclableProductionPlan;
  onClose: () => void;
  onPlanUpdated: () => void;
}

const EditRecyclableProductionPlan: React.FC<EditRecyclableProductionPlanProps> = ({ plan, onClose, onPlanUpdated }) => {
  const { t } = useTranslation(['production', 'common']);
  const [name, setName] = useState(plan.name);
  const [description, setDescription] = useState<string>(plan.description || '');
  const [quantityToProduce, setQuantityToProduce] = useState<number>(plan.quantityToProduce);
  const [plannedStartDate, setPlannedStartDate] = useState<string | undefined>(plan.plannedStartDate);
  const [estimatedProductionTimeMinutes, setEstimatedProductionTimeMinutes] = useState<number>(plan.estimatedProductionTimeMinutes);
  const [notes, setNotes] = useState<string>(plan.notes || '');

  type MaterialRow = { id?: number; rawMaterialId: number | ''; requiredQuantity: number | '' };
  const [materials, setMaterials] = useState<MaterialRow[]>(
    plan.requiredRecyclables.map(m => ({ id: m.id, rawMaterialId: m.rawMaterialId, requiredQuantity: m.requiredQuantity }))
  );

  const [allRecyclables, setAllRecyclables] = useState<types.RawMaterial[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentRecyclable, setCurrentRecyclable] = useState<{ rawMaterialId: number; requiredQuantity: number }>({ rawMaterialId: 0, requiredQuantity: 1 });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await inventoryApi.getAllMaterialsIncludingInactive();
        const list = res.data.filter(m => m.type === types.MaterialType.RecyclableMaterial && m.isActive);
        setAllRecyclables(list);
      } catch (e: any) {
        setError(e.response?.data?.message || t('editRecyclablePlan.messages.failedToLoadMaterials'));
      }
    };
    load();
  }, []);

  const removeMaterialRow = (index: number) => {
    setMaterials(prev => prev.filter((_, i) => i !== index));
  };

  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    // Prevent number input from changing value when scrolling
    if (e.currentTarget.type === 'number') {
      e.currentTarget.blur();
    }
  };

  const updateMaterialRow = (index: number, field: 'rawMaterialId' | 'requiredQuantity', value: any) => {
    setMaterials(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row));
  };

  const handleSave = async () => {
    setError(null);
    if (!name.trim()) { setError(t('editRecyclablePlan.messages.nameRequired')); return; }
    if (!quantityToProduce || quantityToProduce <= 0) { setError(t('editRecyclablePlan.messages.quantityMustBeGreaterThanZero')); return; }
    if (!estimatedProductionTimeMinutes || estimatedProductionTimeMinutes <= 0) { setError(t('editRecyclablePlan.messages.estimatedTimeMustBeGreaterThanZero')); return; }
    if (materials.length === 0) { setError(t('editRecyclablePlan.messages.addAtLeastOneRecyclable')); return; }
    if (materials.some(m => !m.rawMaterialId || !m.requiredQuantity || Number(m.requiredQuantity) <= 0)) { setError(t('editRecyclablePlan.messages.allMaterialsMustBeValid')); return; }

    const payload: types.UpdateRecyclableProductionPlanRequest = {
      name,
      description: description || undefined,
      quantityToProduce,
      plannedStartDate: plannedStartDate || undefined,
      estimatedProductionTimeMinutes,
      notes: notes || undefined,
      requiredRecyclables: materials.map(m => ({ rawMaterialId: Number(m.rawMaterialId), requiredQuantity: Number(m.requiredQuantity) }))
    };

    try {
      setIsSaving(true);
      await productionPlanApi.updateRecyclablePlan(plan.id, payload);
      onPlanUpdated();
    } catch (e: any) {
      setError(e.response?.data?.message || t('editRecyclablePlan.messages.failedToUpdate'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="edit-production-plan-overlay" onClick={onClose}>
      <div className="edit-production-plan-modal" onClick={(e) => e.stopPropagation()}>
        <div className="edit-production-plan-header">
          <h2>{t('editRecyclablePlan.title')}</h2>
          <button className="btn btn-secondary btn-sm" onClick={onClose}><X size={16} /></button>
        </div>

        {error && <div className="error-message" style={{ margin: '12px' }}>{error}</div>}

        <div className="edit-production-plan-form">
          {/* Plan Details - target raw material (read-only) */}
          <div className="form-section">
            <h3>{t('editRecyclablePlan.sections.planDetails')}</h3>
            <div className="form-row">
              <div className="form-group">
                <label>{t('editRecyclablePlan.fields.targetRawMaterial')}</label>
                <input value={plan.targetRawMaterialName} disabled />
              </div>
              <div className="form-group">
                <label>{t('editRecyclablePlan.fields.color')}</label>
                <input value={plan.targetRawMaterialColor} disabled />
              </div>
              <div className="form-group">
                <label>{t('editRecyclablePlan.fields.quantityType')}</label>
                <input value={plan.targetRawMaterialQuantityType} disabled />
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="form-row">
              <div className="form-group">
                <label>{t('editRecyclablePlan.fields.planName')}</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('editRecyclablePlan.placeholders.planName')} />
              </div>
              <div className="form-group">
                <label>{t('editRecyclablePlan.fields.plannedStartDate')}</label>
                <input type="date" value={plannedStartDate ? plannedStartDate.substring(0,10) : ''} onChange={(e) => setPlannedStartDate(e.target.value || undefined)} />
              </div>
              <div className="form-group">
                <label>{t('editRecyclablePlan.fields.quantityToProduce')}</label>
                <input type="number" min={0} step="0.01" value={quantityToProduce} onChange={(e) => setQuantityToProduce(Number(e.target.value))} onWheel={handleWheel} />
              </div>
              <div className="form-group">
                <label>{t('editRecyclablePlan.fields.estimatedTimeMin')}</label>
                <input type="number" min={1} step="1" value={estimatedProductionTimeMinutes} onChange={(e) => setEstimatedProductionTimeMinutes(Number(e.target.value))} onWheel={handleWheel} />
              </div>
            </div>
            <div className="form-group">
              <label>{t('editRecyclablePlan.fields.description')}</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
            <div className="form-group">
              <label>{t('editRecyclablePlan.fields.notes')}</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
          </div>

          <div className="form-section">
            <h3>{t('editRecyclablePlan.sections.requiredRecyclables')}</h3>
            <div className="add-material-section">
              <div className="form-row">
                <div className="form-group" style={{ flex: 2 }}>
                  <label>{t('editRecyclablePlan.fields.selectRecyclable')}</label>
                  <select
                    value={currentRecyclable.rawMaterialId}
                    onChange={(e) => setCurrentRecyclable(prev => ({ ...prev, rawMaterialId: Number(e.target.value) }))}
                  >
                    <option value={0}>{t('editRecyclablePlan.fields.selectRecyclableOption')}</option>
                    {allRecyclables.map(mat => (
                      <option key={mat.id} value={mat.id}>
                        {mat.name} ({mat.color}) - {t('editRecyclablePlan.labels.available')} {mat.quantity} {mat.quantityType}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('editRecyclablePlan.fields.quantity')}</label>
                  <input
                    type="number"
                    min={0.01}
                    step={0.01}
                    value={currentRecyclable.requiredQuantity}
                    onChange={(e) => setCurrentRecyclable(prev => ({ ...prev, requiredQuantity: parseFloat(e.target.value) || 0 }))}
                    onWheel={handleWheel}
                  />
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      if (currentRecyclable.rawMaterialId === 0 || currentRecyclable.requiredQuantity <= 0) {
                        setError(t('editRecyclablePlan.messages.pleaseSelectRecyclableAndQuantity'));
                        return;
                      }
                      if (materials.some(m => Number(m.rawMaterialId) === currentRecyclable.rawMaterialId)) {
                        setError(t('editRecyclablePlan.messages.recyclableAlreadyAdded'));
                        return;
                      }
                      setMaterials(prev => [...prev, { rawMaterialId: currentRecyclable.rawMaterialId, requiredQuantity: currentRecyclable.requiredQuantity }]);
                      setCurrentRecyclable({ rawMaterialId: 0, requiredQuantity: 1 });
                      setError(null);
                    }}
                  >
                    <Plus size={16} /> {t('editRecyclablePlan.buttons.add')}
                  </button>
                </div>
              </div>
            </div>
            <div className="selected-materials">
              <h4>{t('editRecyclablePlan.fields.materials')}</h4>
              <table className="materials-table">
                <thead>
                  <tr>
                    <th>{t('editRecyclablePlan.table.material')}</th>
                    <th>{t('editRecyclablePlan.table.requiredQtyPerUnit')}</th>
                    <th>{t('editRecyclablePlan.table.totalNeed')}</th>
                    <th>{t('editRecyclablePlan.table.available')}</th>
                    <th>{t('editRecyclablePlan.table.status')}</th>
                    <th style={{ width: 80 }}>{t('editRecyclablePlan.table.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map((row, idx) => {
                    const selected = allRecyclables.find(r => r.id === row.rawMaterialId);
                    const qtyType = selected?.quantityType || '';
                    const available = selected?.quantity ?? 0;
                    const perUnit = Number(row.requiredQuantity) || 0;
                    const totalNeed = perUnit * quantityToProduce;
                    const isAvailable = available >= totalNeed;
                    const shortage = Math.max(0, totalNeed - available);
                    return (
                      <tr key={idx} className={!isAvailable ? 'insufficient-stock' : ''}>
                        <td>
                          <div className="material-info">
                            <span className="material-name">{selected?.name ?? ''}</span>
                            <span className="material-color">{selected ? `(${selected.color})` : ''}</span>
                          </div>
                        </td>
                        <td>
                          <input
                            className="quantity-input"
                            type="number"
                            min={0}
                            step="0.01"
                            placeholder={t('editRecyclablePlan.fields.perUnit')}
                            value={row.requiredQuantity}
                            onChange={(e) => updateMaterialRow(idx, 'requiredQuantity', e.target.value === '' ? '' : Number(e.target.value))}
                            onWheel={handleWheel}
                          />
                        </td>
                        <td>{totalNeed.toFixed(2)} {qtyType}</td>
                        <td>{available.toFixed(2)} {qtyType}</td>
                        <td>
                          <span className={`status-badge ${isAvailable ? 'status-available' : 'status-insufficient'}`}>
                            {isAvailable ? t('editRecyclablePlan.status.available') : t('editRecyclablePlan.status.short', { amount: shortage.toFixed(2) })}
                          </span>
                        </td>
                        <td>
                          <button className="btn btn-sm btn-danger" onClick={() => removeMaterialRow(idx)}>
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="form-actions">
            <button className="btn btn-secondary" onClick={onClose} disabled={isSaving}>{t('editRecyclablePlan.buttons.cancel')}</button>
            <button className={`btn btn-primary ${isSaving ? 'loading' : ''}`} onClick={handleSave} disabled={isSaving}>
              {isSaving ? t('editRecyclablePlan.buttons.saving') : t('editRecyclablePlan.buttons.saveChanges')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditRecyclableProductionPlan;


