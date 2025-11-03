import React from 'react';
import { XCircle } from 'lucide-react';
import type { RecyclableProductionPlan } from '../../types';
import './EditProductionPlan.css';

interface Props {
  plan: RecyclableProductionPlan;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

const CancelRecyclableProductionPlanModal: React.FC<Props> = ({ plan, onClose, onConfirm, isLoading }) => {
  return (
    <div className="edit-production-plan-overlay" onClick={onClose}>
      <div className="edit-production-plan-modal" onClick={(e) => e.stopPropagation()}>
        <div className="edit-production-plan-header">
          <h2><XCircle size={18} style={{ marginRight: 8 }} /> Cancel Recyclable Plan</h2>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>×</button>
        </div>
        <div className="edit-production-plan-form">
          <div className="form-section">
            <p>Are you sure you want to cancel the plan "{plan.name}"? This action will set its status to Cancelled.</p>
          </div>
          <div className="form-actions">
            <button className="btn btn-secondary" onClick={onClose} disabled={isLoading}>Close</button>
            <button className="btn btn-danger" onClick={onConfirm} disabled={isLoading}>Confirm Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancelRecyclableProductionPlanModal;


