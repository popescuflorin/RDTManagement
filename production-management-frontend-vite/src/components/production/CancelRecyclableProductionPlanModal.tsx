import React from 'react';
import { useTranslation } from 'react-i18next';
import { XCircle } from 'lucide-react';
import { Modal } from '../atoms';
import type { RecyclableProductionPlan } from '../../types';

interface Props {
  plan: RecyclableProductionPlan;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

const CancelRecyclableProductionPlanModal: React.FC<Props> = ({ plan, onClose, onConfirm, isLoading }) => {
  const { t } = useTranslation(['production', 'common']);
  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={t('cancelRecyclablePlan.title')}
      titleIcon={XCircle}
      submitText={isLoading ? t('cancelRecyclablePlan.buttons.confirmCancel') : t('cancelRecyclablePlan.buttons.confirmCancel')}
      cancelText={t('cancelRecyclablePlan.buttons.close')}
      submitVariant="danger"
      isSubmitting={isLoading}
      onSubmit={onConfirm}
    >
      <p>{t('cancelRecyclablePlan.confirmation', { planName: plan.name })}</p>
    </Modal>
  );
};

export default CancelRecyclableProductionPlanModal;


