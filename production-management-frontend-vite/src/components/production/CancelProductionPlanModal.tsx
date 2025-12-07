import React from 'react';
import { useTranslation } from 'react-i18next';
import { XCircle } from 'lucide-react';
import { Modal } from '../atoms';
import type { ProductionPlan } from '../../types';

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
    <Modal
      isOpen={true}
      onClose={onClose}
      title={t('cancelPlan.title')}
      titleIcon={XCircle}
      submitText={isLoading ? t('cancelPlan.buttons.cancelling') : t('cancelPlan.buttons.cancelPlan')}
      cancelText={t('cancelPlan.buttons.goBack')}
      submitVariant="danger"
      isSubmitting={isLoading}
      onSubmit={onConfirm}
    >
      <p>{t('cancelPlan.confirmation', { planName: plan.name })}</p>
      <p style={{ color: 'var(--warning-700)', fontWeight: 500, marginTop: 'var(--space-md)' }}>
        {t('cancelPlan.warning')}
      </p>
    </Modal>
  );
};

export default CancelProductionPlanModal;
