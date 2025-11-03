import React, { useEffect, useMemo, useState } from 'react';
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
        setError(e.response?.data?.message || 'Failed to load materials');
      }
    };
    load();
  }, []);

  const recyclableOptions = useMemo(() => allRecyclables.map(m => ({ value: m.id, label: `${m.name} (${m.color}) - ${m.quantityType}` })), [allRecyclables]);

  const addMaterialRow = () => {
    setMaterials(prev => [...prev, { rawMaterialId: '', requiredQuantity: '' }]);
  };

  const removeMaterialRow = (index: number) => {
    setMaterials(prev => prev.filter((_, i) => i !== index));
  };

  const updateMaterialRow = (index: number, field: 'rawMaterialId' | 'requiredQuantity', value: any) => {
    setMaterials(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row));
  };

  const handleSave = async () => {
    setError(null);
    if (!name.trim()) { setError('Name is required'); return; }
    if (!quantityToProduce || quantityToProduce <= 0) { setError('Quantity to produce must be > 0'); return; }
    if (!estimatedProductionTimeMinutes || estimatedProductionTimeMinutes <= 0) { setError('Estimated time must be > 0'); return; }
    if (materials.length === 0) { setError('Add at least one recyclable material'); return; }
    if (materials.some(m => !m.rawMaterialId || !m.requiredQuantity || Number(m.requiredQuantity) <= 0)) { setError('All materials must be valid'); return; }

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
      setError(e.response?.data?.message || 'Failed to update plan');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="edit-production-plan-overlay" onClick={onClose}>
      <div className="edit-production-plan-modal" onClick={(e) => e.stopPropagation()}>
        <div className="edit-production-plan-header">
          <h2>Edit Recyclable Production Plan</h2>
          <button className="btn btn-secondary btn-sm" onClick={onClose}><X size={16} /></button>
        </div>

        {error && <div className="error-message" style={{ margin: '12px' }}>{error}</div>}

        <div className="edit-production-plan-form">
          {/* Plan Details - target raw material (read-only) */}
          <div className="form-section">
            <h3>Plan Details</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Target Raw Material</label>
                <input value={plan.targetRawMaterialName} disabled />
              </div>
              <div className="form-group">
                <label>Color</label>
                <input value={plan.targetRawMaterialColor} disabled />
              </div>
              <div className="form-group">
                <label>Quantity Type</label>
                <input value={plan.targetRawMaterialQuantityType} disabled />
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="form-row">
              <div className="form-group">
                <label>Plan Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter plan name" />
              </div>
              <div className="form-group">
                <label>Planned Start Date</label>
                <input type="date" value={plannedStartDate ? plannedStartDate.substring(0,10) : ''} onChange={(e) => setPlannedStartDate(e.target.value || undefined)} />
              </div>
              <div className="form-group">
                <label>Quantity to Produce</label>
                <input type="number" min={0} step="0.01" value={quantityToProduce} onChange={(e) => setQuantityToProduce(Number(e.target.value))} />
              </div>
              <div className="form-group">
                <label>Estimated Time (min)</label>
                <input type="number" min={1} step="1" value={estimatedProductionTimeMinutes} onChange={(e) => setEstimatedProductionTimeMinutes(Number(e.target.value))} />
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
          </div>

          <div className="form-section">
            <h3>Required Recyclables (per unit)</h3>
            <div className="add-material-section">
              <div className="form-row">
                <div className="form-group" style={{ flex: 2 }}>
                  <label>Select Recyclable</label>
                  <select
                    value={currentRecyclable.rawMaterialId}
                    onChange={(e) => setCurrentRecyclable(prev => ({ ...prev, rawMaterialId: Number(e.target.value) }))}
                  >
                    <option value={0}>-- Select a recyclable --</option>
                    {allRecyclables.map(mat => (
                      <option key={mat.id} value={mat.id}>
                        {mat.name} ({mat.color}) - Available: {mat.quantity} {mat.quantityType}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Quantity</label>
                  <input
                    type="number"
                    min={0.01}
                    step={0.01}
                    value={currentRecyclable.requiredQuantity}
                    onChange={(e) => setCurrentRecyclable(prev => ({ ...prev, requiredQuantity: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      if (currentRecyclable.rawMaterialId === 0 || currentRecyclable.requiredQuantity <= 0) {
                        setError('Please select a recyclable and enter a valid quantity');
                        return;
                      }
                      if (materials.some(m => Number(m.rawMaterialId) === currentRecyclable.rawMaterialId)) {
                        setError('Recyclable material already added');
                        return;
                      }
                      setMaterials(prev => [...prev, { rawMaterialId: currentRecyclable.rawMaterialId, requiredQuantity: currentRecyclable.requiredQuantity }]);
                      setCurrentRecyclable({ rawMaterialId: 0, requiredQuantity: 1 });
                      setError(null);
                    }}
                  >
                    <Plus size={16} /> Add
                  </button>
                </div>
              </div>
            </div>
            <div className="selected-materials">
              <h4>Materials</h4>
              <table className="materials-table">
                <thead>
                  <tr>
                    <th>Material</th>
                    <th>Required Qty (per unit)</th>
                    <th>Total Need</th>
                    <th>Available</th>
                    <th>Status</th>
                    <th style={{ width: 80 }}>Actions</th>
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
                            placeholder="per unit"
                            value={row.requiredQuantity}
                            onChange={(e) => updateMaterialRow(idx, 'requiredQuantity', e.target.value === '' ? '' : Number(e.target.value))}
                          />
                        </td>
                        <td>{totalNeed.toFixed(2)} {qtyType}</td>
                        <td>{available.toFixed(2)} {qtyType}</td>
                        <td>
                          <span className={`status-badge ${isAvailable ? 'status-available' : 'status-insufficient'}`}>
                            {isAvailable ? 'Available' : `Short ${shortage.toFixed(2)}`}
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
            <button className="btn btn-secondary" onClick={onClose} disabled={isSaving}>Cancel</button>
            <button className={`btn btn-primary ${isSaving ? 'loading' : ''}`} onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditRecyclableProductionPlan;


