import React, { useMemo } from 'react';
import { CheckCircle } from 'lucide-react';
import type { RecyclableProductionPlan } from '../../types';
import './EditProductionPlan.css';

interface Props {
  plan: RecyclableProductionPlan;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

const ProcessRecyclableProductionPlanModal: React.FC<Props> = ({ plan, onClose, onConfirm, isLoading }) => {
  const canProcess = useMemo(() => {
    return plan.requiredRecyclables.every(m => (m.availableQuantity ?? 0) >= (m.requiredQuantity * plan.quantityToProduce));
  }, [plan]);

  return (
    <div className="edit-production-plan-overlay" onClick={onClose}>
      <div className="edit-production-plan-modal" onClick={(e) => e.stopPropagation()}>
        <div className="edit-production-plan-header">
          <h2><CheckCircle size={18} style={{ marginRight: 8 }} /> Process Recyclable Plan</h2>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>×</button>
        </div>
        <div className="edit-production-plan-form">
          <div className="form-section">
            <h3>Overview</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Plan Name</label>
                <input value={plan.name} disabled />
              </div>
              <div className="form-group">
                <label>Target Raw Material</label>
                <input value={plan.targetRawMaterialName} disabled />
              </div>
              <div className="form-group">
                <label>Quantity to Produce</label>
                <input value={`${plan.quantityToProduce} ${plan.targetRawMaterialQuantityType}`} disabled />
              </div>
            </div>
          </div>
          <div className="form-section">
            <h3>Recyclables to Consume</h3>
            <div className="selected-materials">
              <table className="materials-table">
                <thead>
                  <tr>
                    <th>Material</th>
                    <th>Total Need</th>
                    <th>Available</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.requiredRecyclables.map((m, idx) => {
                    const totalNeed = m.requiredQuantity * plan.quantityToProduce;
                    const available = m.availableQuantity ?? 0;
                    const ok = available >= totalNeed;
                    return (
                      <tr key={idx} className={!ok ? 'insufficient-stock' : ''}>
                        <td>
                          <div className="material-info">
                            <span className="material-name">{m.materialName}</span>
                            <span className="material-color">({m.materialColor})</span>
                          </div>
                        </td>
                        <td>{totalNeed.toFixed(2)} {m.quantityType}</td>
                        <td>{available.toFixed(2)} {m.quantityType}</td>
                        <td>
                          <span className={`status-badge ${ok ? 'status-available' : 'status-insufficient'}`}>
                            {ok ? 'Available' : `Short ${(totalNeed - available).toFixed(2)}`}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-secondary" onClick={onClose} disabled={isLoading}>Close</button>
            <button className="btn btn-primary" onClick={onConfirm} disabled={isLoading || !canProcess}>
              {isLoading ? 'Processing...' : 'Confirm Process'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessRecyclableProductionPlanModal;


