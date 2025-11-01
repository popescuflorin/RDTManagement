import React from 'react';
import type { ProductionPlan } from '../../types';
import './CancelProductionPlanModal.css';

interface CancelProductionPlanModalProps {
  plan: ProductionPlan;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

const CancelProductionPlanModal: React.FC<CancelProductionPlanModalProps> = ({
  plan,
  onClose,
  onConfirm,
  isLoading
}) => {
  return (
    <div className="cancel-plan-overlay" onClick={onClose}>
      <div className="cancel-plan-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cancel-plan-header">
          <h2>Cancel Production Plan</h2>
        </div>

        <div className="cancel-plan-content">
          <p>Are you sure you want to cancel "{plan.name}"?</p>
          <p className="warning-text">This will mark the plan as cancelled and it cannot be executed.</p>
        </div>

        <div className="cancel-plan-actions">
          <button
            type="button"
            onClick={onClose}
            className="cancel-button"
            disabled={isLoading}
          >
            Go Back
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="delete-button"
            disabled={isLoading}
          >
            {isLoading ? 'Cancelling...' : 'Cancel Plan'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelProductionPlanModal;
