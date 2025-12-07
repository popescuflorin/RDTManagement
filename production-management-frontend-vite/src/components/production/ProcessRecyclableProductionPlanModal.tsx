import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, Package, CheckCircle as CheckCircleIcon, AlertTriangle } from 'lucide-react';
import { Modal, FormSection, FormRow, FormGroup, Label, Input, Table } from '../atoms';
import type { RecyclableProductionPlan } from '../../types';
import type { TableColumn } from '../atoms';

interface Props {
  plan: RecyclableProductionPlan;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

const ProcessRecyclableProductionPlanModal: React.FC<Props> = ({ plan, onClose, onConfirm, isLoading }) => {
  const { t } = useTranslation(['production', 'common']);
  const canProcess = useMemo(() => {
    return plan.requiredRecyclables.every(m => (m.availableQuantity ?? 0) >= (m.requiredQuantity * plan.quantityToProduce));
  }, [plan]);

  const tableColumns: TableColumn<typeof plan.requiredRecyclables[0] & { totalNeed: number; available: number; ok: boolean }>[] = [
    {
      key: 'material',
      label: t('processRecyclablePlan.table.material'),
      render: (_, m) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontWeight: 500 }}>{m.materialName}</span>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>({m.materialColor})</span>
        </div>
      )
    },
    {
      key: 'totalNeed',
      label: t('processRecyclablePlan.table.totalNeed'),
      render: (_, m) => `${m.totalNeed.toFixed(2)} ${m.quantityType}`
    },
    {
      key: 'available',
      label: t('processRecyclablePlan.table.available'),
      render: (_, m) => `${m.available.toFixed(2)} ${m.quantityType}`
    },
    {
      key: 'status',
      label: t('processRecyclablePlan.table.status'),
      render: (_, m) => (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 8px',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--text-sm)',
          fontWeight: 500,
          backgroundColor: m.ok ? 'var(--success-100)' : 'var(--warning-100)',
          color: m.ok ? 'var(--success-700)' : 'var(--warning-700)'
        }}>
          {m.ok ? <CheckCircleIcon size={14} /> : <AlertTriangle size={14} />}
          {m.ok ? t('processRecyclablePlan.status.available') : t('processRecyclablePlan.status.short', { amount: (m.totalNeed - m.available).toFixed(2) })}
        </span>
      )
    }
  ];

  const tableData = plan.requiredRecyclables.map((m) => {
    const totalNeed = m.requiredQuantity * plan.quantityToProduce;
    const available = m.availableQuantity ?? 0;
    const ok = available >= totalNeed;
    return {
      ...m,
      totalNeed,
      available,
      ok
    };
  });

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={t('processRecyclablePlan.title')}
      titleIcon={CheckCircle}
      maxWidth="900px"
      footer={
        <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-md btn-secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            {t('processRecyclablePlan.buttons.close')}
          </button>
          <button
            type="button"
            className="btn btn-md btn-primary"
            onClick={onConfirm}
            disabled={isLoading || !canProcess}
          >
            {isLoading ? t('processRecyclablePlan.buttons.processing') : t('processRecyclablePlan.buttons.confirmProcess')}
          </button>
        </div>
      }
    >
      <FormSection title={t('processRecyclablePlan.sections.overview')} titleIcon={Package}>
        <FormRow>
          <FormGroup>
            <Label>{t('processRecyclablePlan.fields.planName')}</Label>
            <Input value={plan.name} disabled />
          </FormGroup>
          <FormGroup>
            <Label>{t('processRecyclablePlan.fields.targetRawMaterial')}</Label>
            <Input value={plan.targetRawMaterialName} disabled />
          </FormGroup>
          <FormGroup>
            <Label>{t('processRecyclablePlan.fields.quantityToProduce')}</Label>
            <Input value={`${plan.quantityToProduce} ${plan.targetRawMaterialQuantityType}`} disabled />
          </FormGroup>
        </FormRow>
      </FormSection>
      <FormSection title={t('processRecyclablePlan.sections.recyclablesToConsume')} titleIcon={Package}>
        <Table
          columns={tableColumns}
          data={tableData}
          getRowKey={(_, index) => index.toString()}
          getRowClassName={(m) => !m.ok ? 'insufficient-stock' : ''}
          showContainer={false}
        />
      </FormSection>
    </Modal>
  );
};

export default ProcessRecyclableProductionPlanModal;


