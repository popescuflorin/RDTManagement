import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Package,
  Clock,
  Calendar,
  FileText,
  CheckCircle,
  AlertTriangle,
  Eye,
  X
} from 'lucide-react';
import { Modal, ViewContent, ViewSection, ViewGrid, ViewItem, ViewLabel, ViewValue, Table } from '../atoms';
import type { RecyclableProductionPlan } from '../../types';
import { ProductionPlanStatus } from '../../types';
import type { TableColumn } from '../atoms';

interface ViewRecyclableProductionPlanProps {
  plan: RecyclableProductionPlan;
  onClose: () => void;
}

const ViewRecyclableProductionPlan: React.FC<ViewRecyclableProductionPlanProps> = ({ plan, onClose }) => {
  const { t } = useTranslation(['production', 'common']);
  const getStatusInfo = (status: ProductionPlanStatus) => {
    switch (status) {
      case ProductionPlanStatus.Draft:
        return { label: t('status.draft'), color: 'status-draft', icon: FileText };
      case ProductionPlanStatus.Planned:
        return { label: t('status.planned'), color: 'status-planned', icon: Calendar };
      case ProductionPlanStatus.InProgress:
        return { label: t('status.inProgress'), color: 'status-in-progress', icon: Clock };
      case ProductionPlanStatus.Completed:
        return { label: t('status.completed'), color: 'status-completed', icon: CheckCircle };
      case ProductionPlanStatus.Cancelled:
        return { label: t('status.cancelled'), color: 'status-cancelled', icon: X };
      default:
        return { label: t('status.unknown'), color: 'status-draft', icon: FileText };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const statusInfo = getStatusInfo(plan.status);
  const StatusIcon = statusInfo.icon;

  const recyclablesTableColumns: TableColumn<typeof plan.requiredRecyclables[0] & { totalNeeded: number; isAvailable: boolean; shortage: number }>[] = [
    {
      key: 'material',
      label: t('viewPlan.table.material'),
      render: (_, m) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontWeight: 500 }}>{m.materialName}</span>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>({m.materialColor})</span>
        </div>
      )
    },
    {
      key: 'requiredPerUnit',
      label: t('viewPlan.table.requiredPerUnit'),
      render: (_, m) => `${m.requiredQuantity} ${m.quantityType}`
    },
    {
      key: 'totalNeed',
      label: t('viewPlan.table.totalNeed'),
      render: (_, m) => `${m.totalNeeded.toFixed(2)} ${m.quantityType}`
    },
    {
      key: 'available',
      label: t('viewPlan.table.available'),
      render: (_, m) => `${m.availableQuantity.toFixed(2)} ${m.quantityType}`
    },
    {
      key: 'status',
      label: t('viewPlan.table.status'),
      render: (_, m) => (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 8px',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--text-sm)',
          fontWeight: 500,
          backgroundColor: m.isAvailable ? 'var(--success-100)' : 'var(--warning-100)',
          color: m.isAvailable ? 'var(--success-700)' : 'var(--warning-700)'
        }}>
          {m.isAvailable ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
          {m.isAvailable ? t('viewPlan.status.available') : t('viewPlan.status.short', { amount: m.shortage.toFixed(2) })}
        </div>
      )
    }
  ];

  const recyclablesTableData = plan.requiredRecyclables.map((m) => {
    const totalNeeded = m.requiredQuantity * plan.quantityToProduce;
    const isAvailable = m.availableQuantity >= totalNeeded;
    const shortage = totalNeeded - m.availableQuantity;
    return {
      ...m,
      totalNeeded,
      isAvailable,
      shortage
    };
  });

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={t('viewPlan.recyclableTitle')}
      titleIcon={Eye}
      showCancel={true}
      cancelText={t('viewPlan.buttons.close')}
      maxWidth="1000px"
      footer={
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
            backgroundColor: statusInfo.color === 'status-completed' ? 'var(--success-100)' : 
                           statusInfo.color === 'status-cancelled' ? 'var(--error-100)' :
                           statusInfo.color === 'status-in-progress' ? 'var(--warning-100)' :
                           statusInfo.color === 'status-planned' ? 'var(--info-100)' : 'var(--surface-hover)',
            color: statusInfo.color === 'status-completed' ? 'var(--success-700)' : 
                   statusInfo.color === 'status-cancelled' ? 'var(--error-700)' :
                   statusInfo.color === 'status-in-progress' ? 'var(--warning-700)' :
                   statusInfo.color === 'status-planned' ? 'var(--info-700)' : 'var(--text-primary)'
          }}>
            <StatusIcon size={16} />
            <span>{statusInfo.label}</span>
          </div>
        </div>
      }
    >
      <ViewContent>
        <ViewSection title={t('viewPlan.sections.planOverview')} titleIcon={Package}>
          <ViewGrid>
            <ViewItem>
              <ViewLabel>{t('viewPlan.fields.planName')}</ViewLabel>
              <ViewValue>{plan.name}</ViewValue>
            </ViewItem>
            {plan.description && (
              <ViewItem fullWidth>
                <ViewLabel>{t('viewPlan.fields.description')}</ViewLabel>
                <ViewValue>{plan.description}</ViewValue>
              </ViewItem>
            )}
            <ViewItem>
              <ViewLabel>{t('viewPlan.fields.targetRawMaterial')}</ViewLabel>
              <ViewValue>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontWeight: 500 }}>{plan.targetRawMaterialName}</span>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>({plan.targetRawMaterialColor})</span>
                </div>
              </ViewValue>
            </ViewItem>
            <ViewItem>
              <ViewLabel>{t('viewPlan.fields.quantityToProduce')}</ViewLabel>
              <ViewValue>{plan.quantityToProduce} {plan.targetRawMaterialQuantityType}</ViewValue>
            </ViewItem>
          </ViewGrid>
        </ViewSection>

        <ViewSection title={t('viewPlan.sections.timing')} titleIcon={Clock}>
          <ViewGrid>
            <ViewItem>
              <ViewLabel>{t('viewPlan.fields.estimatedProductionTime')}</ViewLabel>
              <ViewValue>{plan.estimatedProductionTimeMinutes} {t('viewPlan.labels.min')}</ViewValue>
            </ViewItem>
            {plan.plannedStartDate && (
              <ViewItem>
                <ViewLabel>{t('viewPlan.fields.plannedStartDate')}</ViewLabel>
                <ViewValue>{formatDate(plan.plannedStartDate)}</ViewValue>
              </ViewItem>
            )}
            <ViewItem>
              <ViewLabel>{t('viewPlan.fields.created')}</ViewLabel>
              <ViewValue>{formatDateTime(plan.createdAt)}</ViewValue>
            </ViewItem>
            {plan.startedAt && (
              <ViewItem>
                <ViewLabel>{t('viewPlan.fields.startedAt')}</ViewLabel>
                <ViewValue>{formatDateTime(plan.startedAt)}</ViewValue>
              </ViewItem>
            )}
            {plan.completedAt && (
              <ViewItem>
                <ViewLabel>{t('viewPlan.fields.completedAt')}</ViewLabel>
                <ViewValue>{formatDateTime(plan.completedAt)}</ViewValue>
              </ViewItem>
            )}
          </ViewGrid>
        </ViewSection>

        <ViewSection title={t('viewPlan.sections.requiredRecyclables')} titleIcon={Package}>
          <Table
            columns={recyclablesTableColumns}
            data={recyclablesTableData}
            getRowKey={(_, index) => index.toString()}
            getRowClassName={(m) => !m.isAvailable ? 'insufficient-stock' : ''}
            showContainer={false}
          />
        </ViewSection>

        {plan.notes && (
          <ViewSection title={t('viewPlan.sections.notes')} titleIcon={FileText}>
            <ViewItem fullWidth>
              <ViewValue>{plan.notes}</ViewValue>
            </ViewItem>
          </ViewSection>
        )}
      </ViewContent>
    </Modal>
  );
};

export default ViewRecyclableProductionPlan;


