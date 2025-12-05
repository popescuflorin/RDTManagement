import React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation(['production', 'common']);
  return (
    <div className="cancel-plan-overlay" onClick={onClose}>
      <div className="cancel-plan-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cancel-plan-header">
          <h2>{t('cancelPlan.title')}</h2>
        </div>

        <div className="cancel-plan-content">
          <p>{t('cancelPlan.confirmation', { planName: plan.name })}</p>
          <p className="warning-text">{t('cancelPlan.warning')}</p>
        </div>

        <div className="cancel-plan-actions">
          <button
            type="button"
            onClick={onClose}
            className="cancel-button"
            disabled={isLoading}
          >
            {t('cancelPlan.buttons.goBack')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="delete-button"
            disabled={isLoading}
          >
            {isLoading ? t('cancelPlan.buttons.cancelling') : t('cancelPlan.buttons.cancelPlan')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelProductionPlanModal;
