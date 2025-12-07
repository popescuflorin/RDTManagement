import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Recycle, Package, Plus, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { Modal, Form, FormSection, FormRow, FormGroup, Label, Input, Textarea, Select, ErrorMessage, Table, DeleteButton } from '../atoms';
import { productionPlanApi, inventoryApi } from '../../services/api';
import type { 
  ProductionPlan,
  RawMaterial,
  CreateRawMaterialRequest,
  CreateRecyclableProductionPlanRequest
} from '../../types';
import { MaterialType } from '../../types';
import type { TableColumn } from '../atoms';

interface CreateRecyclableProductionPlanProps {
  onClose: () => void;
  onPlanCreated: (plan: ProductionPlan) => void;
}

interface RecyclableSelection {
  id: string;
  rawMaterialId: number;
  materialName: string;
  materialColor: string;
  quantityType: string;
  requiredQuantity: number;
  availableQuantity: number;
}

const CreateRecyclableProductionPlan: React.FC<CreateRecyclableProductionPlanProps> = ({ onClose, onPlanCreated }) => {
  const { t } = useTranslation(['production', 'common']);
  const [recyclables, setRecyclables] = useState<RawMaterial[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [useNewRawMaterial, setUseNewRawMaterial] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetRawMaterialId: 0,
    quantityToProduce: 1,
    plannedStartDate: new Date().toISOString().split('T')[0],
    estimatedProductionTimeMinutes: 60,
    notes: ''
  });

  const [newRawMaterial, setNewRawMaterial] = useState<CreateRawMaterialRequest>({
    name: '',
    color: '',
    type: MaterialType.RawMaterial,
    quantity: 0,
    quantityType: 'kg',
    minimumStock: 0,
    unitCost: 0,
    description: ''
  });

  const [selectedRecyclables, setSelectedRecyclables] = useState<RecyclableSelection[]>([]);
  const [currentRecyclable, setCurrentRecyclable] = useState({ rawMaterialId: 0, requiredQuantity: 1 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [allMaterials] = await Promise.all([
        inventoryApi.getAllMaterialsIncludingInactive()
      ]);

      const recyclableMats = allMaterials.data.filter((m: RawMaterial) => m.type === MaterialType.RecyclableMaterial && m.isActive);
      const rawMats = allMaterials.data.filter((m: RawMaterial) => m.type === MaterialType.RawMaterial && m.isActive);

      setRecyclables(recyclableMats);
      setRawMaterials(rawMats);
    } catch (err) {
      console.error(err);
      setError(t('createRecyclablePlan.messages.failedToLoadMaterials'));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (name === 'targetRawMaterialId') {
      if (value === 'new') {
        setUseNewRawMaterial(true);
        setFormData(prev => ({ ...prev, targetRawMaterialId: 0 }));
        return;
      } else {
        setUseNewRawMaterial(false);
        const id = parseInt(value) || 0;
        setFormData(prev => ({ ...prev, targetRawMaterialId: id }));
        return;
      }
    }
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
  };

  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    // Prevent number input from changing value when scrolling
    if (e.currentTarget.type === 'number') {
      e.currentTarget.blur();
    }
  };

  const handleNewRawChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setNewRawMaterial(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
  };

  const handleAddRecyclable = () => {
    if (currentRecyclable.rawMaterialId === 0 || currentRecyclable.requiredQuantity <= 0) {
      setError(t('createRecyclablePlan.messages.pleaseSelectRecyclableAndQuantity'));
      return;
    }

    const mat = recyclables.find(m => m.id === currentRecyclable.rawMaterialId);
    if (!mat) return;
    if (selectedRecyclables.some(m => m.rawMaterialId === currentRecyclable.rawMaterialId)) {
      setError(t('createRecyclablePlan.messages.recyclableAlreadyAdded'));
      return;
    }

    const entry: RecyclableSelection = {
      id: Date.now().toString(),
      rawMaterialId: mat.id,
      materialName: mat.name,
      materialColor: mat.color,
      quantityType: mat.quantityType,
      requiredQuantity: currentRecyclable.requiredQuantity,
      availableQuantity: mat.quantity
    };

    setSelectedRecyclables(prev => [...prev, entry]);
    setCurrentRecyclable({ rawMaterialId: 0, requiredQuantity: 1 });
    setError(null);
  };

  const handleRemoveRecyclable = (id: string) => {
    setSelectedRecyclables(prev => prev.filter(m => m.id !== id));
  };

  const handleUpdateRecyclableQty = (id: string, qty: number) => {
    setSelectedRecyclables(prev => prev.map(m => (m.id === id ? { ...m, requiredQuantity: qty } : m)));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (selectedRecyclables.length === 0) {
        setError(t('createRecyclablePlan.messages.pleaseAddAtLeastOneRecyclable'));
        setIsLoading(false);
        return;
      }

      const request: CreateRecyclableProductionPlanRequest = {
        name: formData.name,
        description: formData.description || undefined,
        quantityToProduce: formData.quantityToProduce,
        plannedStartDate: formData.plannedStartDate || undefined,
        estimatedProductionTimeMinutes: formData.estimatedProductionTimeMinutes,
        notes: formData.notes || undefined,
        requiredRecyclables: selectedRecyclables.map(m => ({ rawMaterialId: m.rawMaterialId, requiredQuantity: m.requiredQuantity }))
      };

      if (useNewRawMaterial) {
        if (!newRawMaterial.name || !newRawMaterial.color || !newRawMaterial.quantityType) {
          setError(t('createRecyclablePlan.messages.pleaseFillAllRequiredFields'));
          setIsLoading(false);
          return;
        }
        request.newRawMaterial = newRawMaterial;
      } else {
        if (formData.targetRawMaterialId === 0) {
          setError(t('createRecyclablePlan.messages.pleaseSelectOutputRawMaterial'));
          setIsLoading(false);
          return;
        }
        request.targetRawMaterialId = formData.targetRawMaterialId;
      }

      const response = await productionPlanApi.createRecyclablePlan(request);
      onPlanCreated(response.data);
      onClose();
    } catch (err: any) {
      console.error('Error creating recyclable production plan:', err);
      setError(err.response?.data?.message || t('createRecyclablePlan.messages.failedToCreate'));
    } finally {
      setIsLoading(false);
    }
  };

  const commonQuantityTypes = ['pieces', 'kg', 'liters', 'meters', 'grams', 'tons'];

  const recyclablesTableColumns: TableColumn<RecyclableSelection & { totalNeeded: number; isAvailable: boolean }>[] = [
    {
      key: 'material',
      label: t('createPlan.table.material'),
      render: (_, m) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontWeight: 500 }}>{m.materialName}</span>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>({m.materialColor})</span>
        </div>
      )
    },
    {
      key: 'requiredPerUnit',
      label: t('createPlan.table.requiredPerUnit'),
      render: (_, m) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Input
            type="number"
            value={m.requiredQuantity}
            onChange={(e) => handleUpdateRecyclableQty(m.id, parseFloat(e.target.value) || 0)}
            onWheel={handleWheel}
            min="0.01"
            step="0.01"
            disabled={isLoading}
            style={{ width: '100px' }}
          />
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            {m.quantityType}
          </span>
        </div>
      )
    },
    {
      key: 'totalNeed',
      label: t('createPlan.table.totalNeed'),
      render: (_, m) => `${m.totalNeeded.toFixed(2)} ${m.quantityType}`
    },
    {
      key: 'available',
      label: t('createPlan.table.available'),
      render: (_, m) => `${m.availableQuantity.toFixed(2)} ${m.quantityType}`
    },
    {
      key: 'status',
      label: t('createPlan.table.status'),
      render: (_, m) => (
        <span style={{
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
          {m.isAvailable ? t('createPlan.status.available') : t('createPlan.status.insufficient')}
        </span>
      )
    },
    {
      key: 'actions',
      label: t('createPlan.table.actions'),
      align: 'center',
      render: (_, m) => (
        <DeleteButton
          title={t('createRecyclablePlan.buttons.remove')}
          onClick={() => handleRemoveRecyclable(m.id)}
          disabled={isLoading}
        />
      )
    }
  ];

  const recyclablesTableData = selectedRecyclables.map((m) => {
    const totalNeeded = m.requiredQuantity * formData.quantityToProduce;
    const isAvailable = m.availableQuantity >= totalNeeded;
    return {
      ...m,
      totalNeeded,
      isAvailable
    };
  });

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={t('createRecyclablePlan.title')}
      titleIcon={Recycle}
      submitText={isLoading ? t('createRecyclablePlan.buttons.creating') : t('createRecyclablePlan.buttons.createRecyclablesPlan')}
      cancelText={t('createRecyclablePlan.buttons.cancel')}
      submitVariant="primary"
      isSubmitting={isLoading || selectedRecyclables.length === 0}
      onSubmit={handleSubmit}
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
        handleSubmit();
      }}>

        <FormSection title={t('createRecyclablePlan.sections.outputRawMaterial')} titleIcon={Package}>
          <FormGroup>
            <Label htmlFor="targetRawMaterialId">{t('createRecyclablePlan.fields.selectRawMaterial')} *</Label>
            <Select
              id="targetRawMaterialId"
              name="targetRawMaterialId"
              value={useNewRawMaterial ? 'new' : formData.targetRawMaterialId}
              onChange={handleInputChange}
              required
              disabled={isLoading}
            >
              <option value={0}>{t('createRecyclablePlan.fields.selectRawMaterialOption')}</option>
              {rawMaterials.map(material => (
                <option key={material.id} value={material.id}>
                  {material.name} ({material.color}) - {t('createRecyclablePlan.labels.currentStock')} {material.quantity} {material.quantityType}
                </option>
              ))}
              <option value="new">{t('createRecyclablePlan.fields.createNewRawMaterial')}</option>
            </Select>
          </FormGroup>

          {useNewRawMaterial && (
            <>
              <FormRow>
                <FormGroup>
                  <Label htmlFor="newRawName">{t('createRecyclablePlan.fields.name')} *</Label>
                  <Input id="newRawName" name="name" value={newRawMaterial.name} onChange={handleNewRawChange} required disabled={isLoading} />
                </FormGroup>
                <FormGroup>
                  <Label htmlFor="newRawColor">{t('createRecyclablePlan.fields.color')} *</Label>
                  <Input id="newRawColor" name="color" value={newRawMaterial.color} onChange={handleNewRawChange} required disabled={isLoading} />
                </FormGroup>
              </FormRow>
              <FormRow>
                <FormGroup>
                  <Label htmlFor="newRawQtyType">{t('createRecyclablePlan.fields.unitType')} *</Label>
                  <Input id="newRawQtyType" name="quantityType" value={newRawMaterial.quantityType} onChange={handleNewRawChange} required disabled={isLoading} list="qtyTypes" />
                  <datalist id="qtyTypes">
                    {commonQuantityTypes.map(type => (<option key={type} value={type} />))}
                  </datalist>
                </FormGroup>
                <FormGroup>
                  <Label htmlFor="newRawMinStock">{t('createRecyclablePlan.fields.minimumStock')}</Label>
                  <Input type="number" id="newRawMinStock" name="minimumStock" value={newRawMaterial.minimumStock} onChange={handleNewRawChange} onWheel={handleWheel} min={0} step={1} disabled={isLoading} />
                </FormGroup>
              </FormRow>
              <FormGroup>
                <Label htmlFor="newRawDesc">{t('createRecyclablePlan.fields.description')}</Label>
                <Textarea id="newRawDesc" name="description" value={newRawMaterial.description || ''} onChange={handleNewRawChange} rows={2} disabled={isLoading} />
              </FormGroup>
            </>
          )}
        </FormSection>

        <FormSection title={t('createRecyclablePlan.sections.planDetails')} titleIcon={FileText}>
          <FormGroup>
            <Label htmlFor="name">{t('createRecyclablePlan.fields.planName')} *</Label>
            <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required disabled={isLoading} placeholder={t('createRecyclablePlan.placeholders.planName')} />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="description">{t('createRecyclablePlan.fields.description')}</Label>
            <Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} rows={2} disabled={isLoading} />
          </FormGroup>
          <FormRow>
            <FormGroup>
              <Label htmlFor="quantityToProduce">{t('createRecyclablePlan.fields.quantityToProduce')} *</Label>
              <Input type="number" id="quantityToProduce" name="quantityToProduce" value={formData.quantityToProduce} onChange={handleInputChange} onWheel={handleWheel} min={0.01} step={0.01} required disabled={isLoading} />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="estimatedProductionTimeMinutes">{t('createRecyclablePlan.fields.estimatedTimeMinutes')} *</Label>
              <Input type="number" id="estimatedProductionTimeMinutes" name="estimatedProductionTimeMinutes" value={formData.estimatedProductionTimeMinutes} onChange={handleInputChange} onWheel={handleWheel} min={1} step={1} required disabled={isLoading} />
            </FormGroup>
          </FormRow>
          <FormGroup>
            <Label htmlFor="plannedStartDate">{t('createRecyclablePlan.fields.plannedStartDate')}</Label>
            <Input type="date" id="plannedStartDate" name="plannedStartDate" value={formData.plannedStartDate} onChange={handleInputChange} disabled={isLoading} />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="notes">{t('createRecyclablePlan.fields.notes')}</Label>
            <Textarea id="notes" name="notes" value={formData.notes} onChange={handleInputChange} rows={2} disabled={isLoading} />
          </FormGroup>
        </FormSection>

        <FormSection title={t('createRecyclablePlan.sections.requiredRecyclables')} titleIcon={Package}>
          <FormRow>
            <div style={{ flex: 2 }}>
              <FormGroup>
                <Label htmlFor="currentRecyclable">{t('createRecyclablePlan.fields.selectRecyclable')}</Label>
                <Select id="currentRecyclable" value={currentRecyclable.rawMaterialId} onChange={(e) => setCurrentRecyclable(prev => ({ ...prev, rawMaterialId: parseInt(e.target.value) }))} disabled={isLoading}>
                  <option value={0}>{t('createRecyclablePlan.fields.selectRecyclableOption')}</option>
                  {recyclables.map(mat => (
                    <option key={mat.id} value={mat.id}>
                      {mat.name} ({mat.color}) - {t('createRecyclablePlan.labels.available')} {mat.quantity} {mat.quantityType}
                    </option>
                  ))}
                </Select>
              </FormGroup>
            </div>
            <FormGroup>
              <Label htmlFor="recyclableQty">{t('createRecyclablePlan.fields.quantity')}</Label>
              <Input type="number" id="recyclableQty" value={currentRecyclable.requiredQuantity} onChange={(e) => setCurrentRecyclable(prev => ({ ...prev, requiredQuantity: parseFloat(e.target.value) || 0 }))} onWheel={handleWheel} min={0.01} step={0.01} disabled={isLoading} />
            </FormGroup>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <FormGroup>
                <Label>&nbsp;</Label>
                <button
                  type="button"
                  onClick={handleAddRecyclable}
                  className="btn btn-secondary"
                  disabled={isLoading}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <Plus size={16} />
                  {t('createRecyclablePlan.buttons.add')}
                </button>
              </FormGroup>
            </div>
          </FormRow>

          {selectedRecyclables.length > 0 && (
            <Table
              columns={recyclablesTableColumns}
              data={recyclablesTableData}
              getRowKey={(m) => m.id}
              getRowClassName={(m) => !m.isAvailable ? 'insufficient-stock' : ''}
              showContainer={false}
            />
          )}
        </FormSection>
      </Form>
    </Modal>
  );
};

export default CreateRecyclableProductionPlan;


