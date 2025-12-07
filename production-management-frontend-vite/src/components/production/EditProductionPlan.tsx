import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Package, Plus, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { Modal, Form, FormSection, FormRow, FormGroup, Label, Input, Textarea, Select, ErrorMessage, Table, DeleteButton } from '../atoms';
import { productionPlanApi, inventoryApi } from '../../services/api';
import type { 
  ProductionPlan, 
  RawMaterial,
  UpdateProductionPlanRequest,
  CreateProductionPlanMaterialRequest 
} from '../../types';
import { MaterialType } from '../../types';
import type { TableColumn } from '../atoms';

interface EditProductionPlanProps {
  plan: ProductionPlan;
  onClose: () => void;
  onPlanUpdated: (updatedPlan: ProductionPlan) => void;
}

interface MaterialSelection {
  id: string;
  rawMaterialId: number;
  materialName: string;
  materialColor: string;
  quantityType: string;
  requiredQuantity: number;
  availableQuantity: number;
  unitCost: number;
}

const EditProductionPlan: React.FC<EditProductionPlanProps> = ({ plan, onClose, onPlanUpdated }) => {
  const { t } = useTranslation(['production', 'common']);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [materialsError, setMaterialsError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: plan.name,
    description: plan.description || '',
    quantityToProduce: plan.quantityToProduce,
    plannedStartDate: plan.plannedStartDate || '',
    estimatedProductionTimeMinutes: plan.estimatedProductionTimeMinutes,
    notes: plan.notes || ''
  });

  const [selectedMaterials, setSelectedMaterials] = useState<MaterialSelection[]>([]);
  const [currentMaterial, setCurrentMaterial] = useState({
    rawMaterialId: 0,
    requiredQuantity: 1
  });

  useEffect(() => {
    loadData();
    initializeMaterials();
  }, [plan]);

  const loadData = async () => {
    try {
      const rawMaterialsResponse = await inventoryApi.getAllMaterialsIncludingInactive();
      const rawMats = rawMaterialsResponse.data.filter(
        (m: RawMaterial) => m.type === MaterialType.RawMaterial && m.isActive
      );
      setRawMaterials(rawMats);
    } catch (error: any) {
      console.error('Error loading data:', error);
      setError(t('editPlan.messages.failedToLoadMaterials'));
    }
  };

  const initializeMaterials = () => {
    const materials: MaterialSelection[] = plan.requiredMaterials.map(m => ({
      id: Date.now().toString() + '-' + m.rawMaterialId,
      rawMaterialId: m.rawMaterialId,
      materialName: m.materialName,
      materialColor: m.materialColor,
      quantityType: m.quantityType,
      requiredQuantity: m.requiredQuantity,
      availableQuantity: m.availableQuantity,
      unitCost: m.estimatedUnitCost
    }));
    setSelectedMaterials(materials);
  };

  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    // Prevent number input from changing value when scrolling
    if (e.currentTarget.type === 'number') {
      e.currentTarget.blur();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleAddMaterial = () => {
    if (currentMaterial.rawMaterialId === 0 || currentMaterial.requiredQuantity <= 0) {
      setMaterialsError(t('editPlan.messages.pleaseSelectMaterialAndQuantity'));
      return;
    }

    const material = rawMaterials.find(m => m.id === currentMaterial.rawMaterialId);
    if (!material) return;

    // Check if material already added
    if (selectedMaterials.some(m => m.rawMaterialId === currentMaterial.rawMaterialId)) {
      setMaterialsError(t('editPlan.messages.materialAlreadyAdded'));
      return;
    }

    const newSelection: MaterialSelection = {
      id: Date.now().toString(),
      rawMaterialId: material.id,
      materialName: material.name,
      materialColor: material.color,
      quantityType: material.quantityType,
      requiredQuantity: currentMaterial.requiredQuantity,
      availableQuantity: material.quantity,
      unitCost: material.unitCost
    };

    setSelectedMaterials(prev => [...prev, newSelection]);
    setCurrentMaterial({ rawMaterialId: 0, requiredQuantity: 1 });
    setMaterialsError(null);
  };

  const handleRemoveMaterial = (id: string) => {
    setSelectedMaterials(prev => prev.filter(m => m.id !== id));
  };

  const handleUpdateMaterialQuantity = (id: string, quantity: number) => {
    setSelectedMaterials(prev => 
      prev.map(m => m.id === id ? { ...m, requiredQuantity: quantity } : m)
    );
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (selectedMaterials.length === 0) {
        setMaterialsError(t('editPlan.messages.pleaseAddAtLeastOneMaterial'));
        setIsLoading(false);
        return;
      }

      const requiredMaterials: CreateProductionPlanMaterialRequest[] = selectedMaterials.map(m => ({
        rawMaterialId: m.rawMaterialId,
        requiredQuantity: m.requiredQuantity
      }));

      const request: UpdateProductionPlanRequest = {
        name: formData.name,
        description: formData.description,
        quantityToProduce: formData.quantityToProduce,
        plannedStartDate: formData.plannedStartDate || undefined,
        estimatedProductionTimeMinutes: formData.estimatedProductionTimeMinutes,
        notes: formData.notes || undefined,
        requiredMaterials
      };

      const response = await productionPlanApi.updatePlan(plan.id, request);
      onPlanUpdated(response.data);
      onClose();
    } catch (error: any) {
      console.error('Error updating production plan:', error);
      const errorMessage = error.response?.data?.message || t('editPlan.messages.failedToUpdate');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const materialsTableColumns: TableColumn<MaterialSelection & { totalNeeded: number; isAvailable: boolean }>[] = [
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
            onChange={(e) => handleUpdateMaterialQuantity(m.id, parseFloat(e.target.value) || 0)}
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
          title={t('createPlan.buttons.remove')}
          onClick={() => handleRemoveMaterial(m.id)}
          disabled={isLoading}
        />
      )
    }
  ];

  const materialsTableData = selectedMaterials.map((material) => {
    const totalNeeded = material.requiredQuantity * formData.quantityToProduce;
    const isAvailable = material.availableQuantity >= totalNeeded;
    return {
      ...material,
      totalNeeded,
      isAvailable
    };
  });

  return (
    <Modal  
      isOpen={true}
      onClose={onClose}
      title={t('editPlan.title')}
      titleIcon={Edit}
      submitText={isLoading ? t('editPlan.buttons.updating') : t('editPlan.buttons.updateProductionPlan')}
      cancelText={t('createPlan.buttons.cancel')}
      submitVariant="primary"
      isSubmitting={isLoading || selectedMaterials.length === 0}
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

        <FormSection title={t('createPlan.sections.planDetails')} titleIcon={FileText}>
          <FormGroup>
            <Label htmlFor="name">{t('createPlan.fields.planName')} *</Label>
            <Input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder={t('createPlan.placeholders.planName')}
              required
              disabled={isLoading}
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="description">{t('createPlan.fields.description')}</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder={t('createPlan.placeholders.description')}
              rows={2}
              disabled={isLoading}
            />
          </FormGroup>

          <FormRow>
            <FormGroup>
              <Label htmlFor="quantityToProduce">{t('createPlan.fields.quantityToProduce')} *</Label>
              <Input
                type="number"
                id="quantityToProduce"
                name="quantityToProduce"
                value={formData.quantityToProduce}
                onChange={handleInputChange}
                onWheel={handleWheel}
                min="0.01"
                step="0.01"
                required
                disabled={isLoading}
              />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="estimatedProductionTimeMinutes">{t('createPlan.fields.estimatedTimeMinutes')} *</Label>
              <Input
                type="number"
                id="estimatedProductionTimeMinutes"
                name="estimatedProductionTimeMinutes"
                value={formData.estimatedProductionTimeMinutes}
                onChange={handleInputChange}
                onWheel={handleWheel}
                min="1"
                step="1"
                required
                disabled={isLoading}
              />
            </FormGroup>
          </FormRow>

          <FormGroup>
            <Label htmlFor="plannedStartDate">{t('createPlan.fields.plannedStartDate')}</Label>
            <Input
              type="date"
              id="plannedStartDate"
              name="plannedStartDate"
              value={formData.plannedStartDate}
              onChange={handleInputChange}
              disabled={isLoading}
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="notes">{t('createPlan.fields.notes')}</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder={t('createPlan.placeholders.notes')}
              rows={2}
              disabled={isLoading}
            />
          </FormGroup>
        </FormSection>

        <FormSection title={t('createPlan.sections.requiredMaterials')} titleIcon={Package}>
          {materialsError && (
            <ErrorMessage
              message={materialsError}
              onDismiss={() => setMaterialsError(null)}
            />
          )}

          <FormRow>
            <div style={{ flex: 2 }}>
              <FormGroup>
                <Label htmlFor="currentMaterial">{t('createPlan.fields.selectMaterial')}</Label>
                <Select
                  id="currentMaterial"
                  value={currentMaterial.rawMaterialId}
                  onChange={(e) => setCurrentMaterial(prev => ({ ...prev, rawMaterialId: parseInt(e.target.value) }))}
                  disabled={isLoading}
                >
                  <option value={0}>{t('createPlan.fields.selectRawMaterial')}</option>
                  {rawMaterials.map(material => (
                    <option key={material.id} value={material.id}>
                      {material.name} ({material.color}) - {t('createPlan.labels.available')} {material.quantity} {material.quantityType}
                    </option>
                  ))}
                </Select>
              </FormGroup>
            </div>
            <FormGroup>
              <Label htmlFor="materialQuantity">{t('createPlan.fields.quantity')}</Label>
              <Input
                type="number"
                id="materialQuantity"
                value={currentMaterial.requiredQuantity}
                onChange={(e) => setCurrentMaterial(prev => ({ ...prev, requiredQuantity: parseFloat(e.target.value) || 0 }))}
                onWheel={handleWheel}
                min="0.01"
                step="0.01"
                disabled={isLoading}
              />
            </FormGroup>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <FormGroup>
                <Label>&nbsp;</Label>
                <button
                  type="button"
                  onClick={handleAddMaterial}
                  className="btn btn-secondary"
                  disabled={isLoading}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <Plus size={16} />
                  {t('createPlan.buttons.add')}
                </button>
              </FormGroup>
            </div>
          </FormRow>

          {selectedMaterials.length > 0 && (
            <Table
              columns={materialsTableColumns}
              data={materialsTableData}
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

export default EditProductionPlan;
