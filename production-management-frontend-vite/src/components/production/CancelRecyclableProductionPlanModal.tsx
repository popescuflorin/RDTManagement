import React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation(['production', 'common']);
  return (
    <div className="edit-production-plan-overlay" onClick={onClose}>
      <div className="edit-production-plan-modal" onClick={(e) => e.stopPropagation()}>
        <div className="edit-production-plan-header">
          <h2><XCircle size={18} style={{ marginRight: 8 }} /> {t('cancelRecyclablePlan.title')}</h2>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>×</button>
        </div>
        <div className="edit-production-plan-form">
          <div className="form-section">
            <p>{t('cancelRecyclablePlan.confirmation', { planName: plan.name })}</p>
          </div>
          <div className="form-actions">
            <button className="btn btn-secondary" onClick={onClose} disabled={isLoading}>{t('cancelRecyclablePlan.buttons.close')}</button>
            <button className="btn btn-danger" onClick={onConfirm} disabled={isLoading}>{t('cancelRecyclablePlan.buttons.confirmCancel')}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancelRecyclableProductionPlanModal;


