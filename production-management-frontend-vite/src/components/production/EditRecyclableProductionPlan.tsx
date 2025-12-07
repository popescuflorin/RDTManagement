import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Package, Plus, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { Modal, Form, FormSection, FormRow, FormGroup, Label, Input, Textarea, Select, ErrorMessage, Table, DeleteButton } from '../atoms';
import * as types from '../../types';
import { inventoryApi, productionPlanApi } from '../../services/api';
import type { TableColumn } from '../atoms';

interface EditRecyclableProductionPlanProps {
  plan: types.RecyclableProductionPlan;
  onClose: () => void;
  onPlanUpdated: () => void;
}

const EditRecyclableProductionPlan: React.FC<EditRecyclableProductionPlanProps> = ({ plan, onClose, onPlanUpdated }) => {
  const { t } = useTranslation(['production', 'common']);
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
        setError(e.response?.data?.message || t('editRecyclablePlan.messages.failedToLoadMaterials'));
      }
    };
    load();
  }, []);

  const removeMaterialRow = (index: number) => {
    setMaterials(prev => prev.filter((_, i) => i !== index));
  };

  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    // Prevent number input from changing value when scrolling
    if (e.currentTarget.type === 'number') {
      e.currentTarget.blur();
    }
  };

  const updateMaterialRow = (index: number, field: 'rawMaterialId' | 'requiredQuantity', value: any) => {
    setMaterials(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row));
  };

  const handleSave = async () => {
    setError(null);
    if (!name.trim()) { setError(t('editRecyclablePlan.messages.nameRequired')); return; }
    if (!quantityToProduce || quantityToProduce <= 0) { setError(t('editRecyclablePlan.messages.quantityMustBeGreaterThanZero')); return; }
    if (!estimatedProductionTimeMinutes || estimatedProductionTimeMinutes <= 0) { setError(t('editRecyclablePlan.messages.estimatedTimeMustBeGreaterThanZero')); return; }
    if (materials.length === 0) { setError(t('editRecyclablePlan.messages.addAtLeastOneRecyclable')); return; }
    if (materials.some(m => !m.rawMaterialId || !m.requiredQuantity || Number(m.requiredQuantity) <= 0)) { setError(t('editRecyclablePlan.messages.allMaterialsMustBeValid')); return; }

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
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.message || t('editRecyclablePlan.messages.failedToUpdate'));
    } finally {
      setIsSaving(false);
    }
  };

  const recyclablesTableColumns: TableColumn<MaterialRow & { selected: types.RawMaterial | undefined; totalNeed: number; isAvailable: boolean; shortage: number; qtyType: string; available: number }>[] = [
    {
      key: 'material',
      label: t('editRecyclablePlan.table.material'),
      render: (_, row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontWeight: 500 }}>{row.selected?.name ?? ''}</span>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{row.selected ? `(${row.selected.color})` : ''}</span>
        </div>
      )
    },
    {
      key: 'requiredPerUnit',
      label: t('editRecyclablePlan.table.requiredQtyPerUnit'),
      render: (_, row, index) => (
        <Input
          type="number"
          min={0}
          step="0.01"
          placeholder={t('editRecyclablePlan.fields.perUnit')}
          value={row.requiredQuantity}
          onChange={(e) => updateMaterialRow(index, 'requiredQuantity', e.target.value === '' ? '' : Number(e.target.value))}
          onWheel={handleWheel}
          style={{ width: '100px' }}
        />
      )
    },
    {
      key: 'totalNeed',
      label: t('editRecyclablePlan.table.totalNeed'),
      render: (_, row) => `${row.totalNeed.toFixed(2)} ${row.qtyType}`
    },
    {
      key: 'available',
      label: t('editRecyclablePlan.table.available'),
      render: (_, row) => `${row.available.toFixed(2)} ${row.qtyType}`
    },
    {
      key: 'status',
      label: t('editRecyclablePlan.table.status'),
      render: (_, row) => (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 8px',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--text-sm)',
          fontWeight: 500,
          backgroundColor: row.isAvailable ? 'var(--success-100)' : 'var(--warning-100)',
          color: row.isAvailable ? 'var(--success-700)' : 'var(--warning-700)'
        }}>
          {row.isAvailable ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
          {row.isAvailable ? t('editRecyclablePlan.status.available') : t('editRecyclablePlan.status.short', { amount: row.shortage.toFixed(2) })}
        </span>
      )
    },
    {
      key: 'actions',
      label: t('editRecyclablePlan.table.actions'),
      align: 'center',
      render: (_, _row, index) => (
        <DeleteButton
          title={t('editRecyclablePlan.buttons.remove')}
          onClick={() => removeMaterialRow(index)}
          disabled={isSaving}
        />
      )
    }
  ];

  const recyclablesTableData = materials.map((row) => {
    const selected = allRecyclables.find(r => r.id === row.rawMaterialId);
    const qtyType = selected?.quantityType || '';
    const available = selected?.quantity ?? 0;
    const perUnit = Number(row.requiredQuantity) || 0;
    const totalNeed = perUnit * quantityToProduce;
    const isAvailable = available >= totalNeed;
    const shortage = Math.max(0, totalNeed - available);
    return {
      ...row,
      selected,
      totalNeed,
      isAvailable,
      shortage,
      qtyType,
      available
    };
  });

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={t('editRecyclablePlan.title')}
      titleIcon={Edit}
      submitText={isSaving ? t('editRecyclablePlan.buttons.saving') : t('editRecyclablePlan.buttons.saveChanges')}
      cancelText={t('editRecyclablePlan.buttons.cancel')}
      submitVariant="primary"
      isSubmitting={isSaving || materials.length === 0}
      onSubmit={handleSave}
      maxWidth="1000px"
    >
      {error && (
        <ErrorMessage
          message={error}
          onDismiss={() => setError(null)}
        />
      )}

      <Form onSubmit={(e) => {
        e.preventDefault();
        handleSave();
      }}>
        <FormSection title={t('editRecyclablePlan.sections.planDetails')} titleIcon={FileText}>
          <FormRow>
            <FormGroup>
              <Label>{t('editRecyclablePlan.fields.targetRawMaterial')}</Label>
              <Input value={plan.targetRawMaterialName} disabled />
            </FormGroup>
            <FormGroup>
              <Label>{t('editRecyclablePlan.fields.color')}</Label>
              <Input value={plan.targetRawMaterialColor} disabled />
            </FormGroup>
            <FormGroup>
              <Label>{t('editRecyclablePlan.fields.quantityType')}</Label>
              <Input value={plan.targetRawMaterialQuantityType} disabled />
            </FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup>
              <Label>{t('editRecyclablePlan.fields.planName')}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('editRecyclablePlan.placeholders.planName')} />
            </FormGroup>
            <FormGroup>
              <Label>{t('editRecyclablePlan.fields.plannedStartDate')}</Label>
              <Input type="date" value={plannedStartDate ? plannedStartDate.substring(0,10) : ''} onChange={(e) => setPlannedStartDate(e.target.value || undefined)} />
            </FormGroup>
            <FormGroup>
              <Label>{t('editRecyclablePlan.fields.quantityToProduce')}</Label>
              <Input type="number" min={0} step="0.01" value={quantityToProduce} onChange={(e) => setQuantityToProduce(Number(e.target.value))} onWheel={handleWheel} />
            </FormGroup>
            <FormGroup>
              <Label>{t('editRecyclablePlan.fields.estimatedTimeMin')}</Label>
              <Input type="number" min={1} step="1" value={estimatedProductionTimeMinutes} onChange={(e) => setEstimatedProductionTimeMinutes(Number(e.target.value))} onWheel={handleWheel} />
            </FormGroup>
          </FormRow>
          <FormGroup>
            <Label>{t('editRecyclablePlan.fields.description')}</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </FormGroup>
          <FormGroup>
            <Label>{t('editRecyclablePlan.fields.notes')}</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </FormGroup>
        </FormSection>

        <FormSection title={t('editRecyclablePlan.sections.requiredRecyclables')} titleIcon={Package}>
          <FormRow>
            <div style={{ flex: 2 }}>
              <FormGroup>
                <Label>{t('editRecyclablePlan.fields.selectRecyclable')}</Label>
                <Select
                  value={currentRecyclable.rawMaterialId}
                  onChange={(e) => setCurrentRecyclable(prev => ({ ...prev, rawMaterialId: Number(e.target.value) }))}
                  disabled={isSaving}
                >
                  <option value={0}>{t('editRecyclablePlan.fields.selectRecyclableOption')}</option>
                  {allRecyclables.map(mat => (
                    <option key={mat.id} value={mat.id}>
                      {mat.name} ({mat.color}) - {t('editRecyclablePlan.labels.available')} {mat.quantity} {mat.quantityType}
                    </option>
                  ))}
                </Select>
              </FormGroup>
            </div>
            <FormGroup>
              <Label>{t('editRecyclablePlan.fields.quantity')}</Label>
              <Input
                type="number"
                min={0.01}
                step={0.01}
                value={currentRecyclable.requiredQuantity}
                onChange={(e) => setCurrentRecyclable(prev => ({ ...prev, requiredQuantity: parseFloat(e.target.value) || 0 }))}
                onWheel={handleWheel}
                disabled={isSaving}
              />
            </FormGroup>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <FormGroup>
                <Label>&nbsp;</Label>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    if (currentRecyclable.rawMaterialId === 0 || currentRecyclable.requiredQuantity <= 0) {
                      setError(t('editRecyclablePlan.messages.pleaseSelectRecyclableAndQuantity'));
                      return;
                    }
                    if (materials.some(m => Number(m.rawMaterialId) === currentRecyclable.rawMaterialId)) {
                      setError(t('editRecyclablePlan.messages.recyclableAlreadyAdded'));
                      return;
                    }
                    setMaterials(prev => [...prev, { rawMaterialId: currentRecyclable.rawMaterialId, requiredQuantity: currentRecyclable.requiredQuantity }]);
                    setCurrentRecyclable({ rawMaterialId: 0, requiredQuantity: 1 });
                    setError(null);
                  }}
                  disabled={isSaving}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <Plus size={16} />
                  {t('editRecyclablePlan.buttons.add')}
                </button>
              </FormGroup>
            </div>
          </FormRow>

          {materials.length > 0 && (
            <Table
              columns={recyclablesTableColumns}
              data={recyclablesTableData}
              getRowKey={(_, index) => index.toString()}
              getRowClassName={(row) => !row.isAvailable ? 'insufficient-stock' : ''}
              showContainer={false}
            />
          )}
        </FormSection>
      </Form>
    </Modal>
  );
};

export default EditRecyclableProductionPlan;


