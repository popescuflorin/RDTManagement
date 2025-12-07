import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Truck, 
  Package, 
  CheckCircle, 
  Clock,
  Plus,
  AlertTriangle
} from 'lucide-react';
import { Modal, Form, FormSection, FormRow, FormGroup, Label, Input, Textarea, Select, ErrorMessage, Table, DeleteButton, Checkbox, ViewSection, ViewGrid, ViewItem, ViewLabel, ViewValue } from '../atoms';
import { productionPlanApi, inventoryApi } from '../../services/api';
import type { CreateRawMaterialRequest, ProductionPlan, RawMaterial } from '../../types';
import { ProductionPlanStatus, MaterialType } from '../../types';
import type { TableColumn } from '../atoms';

interface ReceiveProductionProps {
  plan: ProductionPlan;
  onClose: () => void;
  onPlanReceived: (updatedPlan: ProductionPlan) => void;
}

interface ProducedMaterial {
  id: string;
  materialId: number;
  materialName: string;
  materialColor: string;
  materialType: MaterialType;
  quantityType: string;
  quantity: number;
}

const ReceiveProduction: React.FC<ReceiveProductionProps> = ({ plan, onClose, onPlanReceived }) => {
  const { t } = useTranslation(['production', 'common']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actualQuantityProduced, setActualQuantityProduced] = useState(plan.quantityToProduce);
  const [actualProductionTimeMinutes, setActualProductionTimeMinutes] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [availableMaterials, setAvailableMaterials] = useState<RawMaterial[]>([]);
  const [producedMaterials, setProducedMaterials] = useState<ProducedMaterial[]>([]);
  const [currentMaterial, setCurrentMaterial] = useState({
    materialId: 0,
    quantity: 1
  });
  const [isAddingToInventory, setIsAddingToInventory] = useState(false);
  const [inventoryUpdateStatus, setInventoryUpdateStatus] = useState<string>('');
  const [materialMode, setMaterialMode] = useState<'existing' | 'new'>('existing');
  const [newMaterialData, setNewMaterialData] = useState({
    name: '',
    color: '',
    type: MaterialType.RawMaterial,
    quantityType: '',
    description: ''
  });
  const [useProducedMaterials, setUseProducedMaterials] = useState(false);

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      const response = await inventoryApi.getAllMaterialsIncludingInactive();
      const materials = response.data.filter(
        (m: RawMaterial) => m.isActive && (m.type === MaterialType.RawMaterial || m.type === MaterialType.RecyclableMaterial || m.type === MaterialType.FinishedProduct)
      );
      setAvailableMaterials(materials);
    } catch (error: any) {
      console.error('Error loading materials:', error);
      setError(t('receiveProduction.messages.failedToLoadMaterials'));
    }
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

  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    // Prevent number input from changing value when scrolling
    if (e.currentTarget.type === 'number') {
      e.currentTarget.blur();
    }
  };

  const handleAddProducedMaterial = async () => {
    if (materialMode === 'existing') {
      if (currentMaterial.materialId === 0 || currentMaterial.quantity <= 0) {
        setError(t('receiveProduction.messages.pleaseSelectMaterialAndQuantity'));
        return;
      }

      const material = availableMaterials.find(m => m.id === currentMaterial.materialId);
      if (!material) return;

      // Check if material already added
      if (producedMaterials.some(m => m.materialId === currentMaterial.materialId)) {
        setError(t('receiveProduction.messages.materialAlreadyAdded'));
        return;
      }

      const newProducedMaterial: ProducedMaterial = {
        id: Date.now().toString(),
        materialId: material.id,
        materialName: material.name,
        materialColor: material.color,
        materialType: material.type,
        quantityType: material.quantityType,
        quantity: currentMaterial.quantity
      };

      setProducedMaterials(prev => [...prev, newProducedMaterial]);
      setCurrentMaterial({ materialId: 0, quantity: 1 });
      setError(null);
    } else {
      // Create new material
      if (!newMaterialData.name || !newMaterialData.color || !newMaterialData.quantityType || currentMaterial.quantity <= 0) {
        setError(t('receiveProduction.messages.pleaseFillAllMaterialDetails'));
        return;
      }

      // Validate that name, color, and quantityType are not just whitespace
      if (newMaterialData.name.trim() === '' || newMaterialData.color.trim() === '' || newMaterialData.quantityType.trim() === '') {
        setError(t('receiveProduction.messages.nameColorQuantityTypeCannotBeEmpty'));
        return;
      }

      try {
        const createMaterialRequest : CreateRawMaterialRequest = {
          name: newMaterialData.name.trim(),
          color: newMaterialData.color.trim(),
          type: newMaterialData.type, // Ensure type is sent as number
          quantity: currentMaterial.quantity,
          quantityType: newMaterialData.quantityType.trim(),
          minimumStock: 0,
          unitCost: 0,
          description: newMaterialData.description?.trim() || ''
        };

        console.log('Creating material with request:', createMaterialRequest);
        const response = await inventoryApi.createMaterial(createMaterialRequest);
        const createdMaterial = response.data;

        const newProducedMaterial: ProducedMaterial = {
          id: Date.now().toString(),
          materialId: createdMaterial.id,
          materialName: createdMaterial.name,
          materialColor: createdMaterial.color,
          materialType: createdMaterial.type,
          quantityType: createdMaterial.quantityType,
          quantity: currentMaterial.quantity
        };

        setProducedMaterials(prev => [...prev, newProducedMaterial]);
        setCurrentMaterial({ materialId: 0, quantity: 1 });
        setNewMaterialData({
          name: '',
          color: '',
          type: MaterialType.RawMaterial,
          quantityType: '',
          description: ''
        });
        setError(null);

        // Refresh available materials list
        await loadMaterials();
      } catch (error: any) {
        console.error('Error creating material:', error);
        console.error('Error response:', error.response?.data);
        setError(error.response?.data?.message || error.response?.data?.title || t('receiveProduction.messages.failedToCreateMaterial'));
      }
    }
  };

  const handleRemoveProducedMaterial = (id: string) => {
    setProducedMaterials(prev => prev.filter(m => m.id !== id));
  };

  const handleUpdateProducedMaterialQuantity = (id: string, quantity: number) => {
    setProducedMaterials(prev => 
      prev.map(m => m.id === id ? { ...m, quantity } : m)
    );
  };

  const handleNewMaterialChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setNewMaterialData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (actualQuantityProduced <= 0) {
        setError(t('receiveProduction.messages.actualQuantityMustBeGreaterThanZero'));
        setIsLoading(false);
        return;
      }

      if (useProducedMaterials && producedMaterials.length === 0) {
        setError(t('receiveProduction.messages.pleaseAddAtLeastOneProducedMaterial'));
        setIsLoading(false);
        return;
      }

      await productionPlanApi.executePlan(plan.id, {
        actualQuantityProduced,
        actualProductionTimeMinutes: actualProductionTimeMinutes || undefined,
        notes: notes || undefined
      });

      // Add produced materials to inventory (only if specified)
      if (useProducedMaterials && producedMaterials.length > 0) {
        setIsAddingToInventory(true);
        setInventoryUpdateStatus(t('receiveProduction.messages.addingMaterialsToInventory'));
        
        const inventoryResults = [];
        for (const producedMaterial of producedMaterials) {
          try {
            setInventoryUpdateStatus(t('receiveProduction.messages.addingMaterialToInventory', { materialName: producedMaterial.materialName }));
            await inventoryApi.addToExisting({
              materialId: producedMaterial.materialId,
              quantityToAdd: producedMaterial.quantity
            });
            inventoryResults.push({ material: producedMaterial.materialName, success: true });
          } catch (materialError: any) {
            console.error(`Error adding ${producedMaterial.materialName} to inventory:`, materialError);
            inventoryResults.push({ 
              material: producedMaterial.materialName, 
              success: false, 
              error: materialError.response?.data?.message || 'Failed to add to inventory'
            });
          }
        }
        
        setIsAddingToInventory(false);
        
        // Show summary of inventory updates
        const successful = inventoryResults.filter(r => r.success).length;
        const failed = inventoryResults.filter(r => !r.success).length;
        
        if (failed === 0) {
          setInventoryUpdateStatus(t('receiveProduction.messages.successfullyAddedMaterials', { count: successful }));
        } else {
          setInventoryUpdateStatus(t('receiveProduction.messages.addedMaterialsSuccessfullyFailed', { successful, failed }));
        }
      } else {
        setInventoryUpdateStatus(t('receiveProduction.messages.productionCompletedUsingPlannedMaterials'));
      }

      // Create an updated plan object with Completed status
      const updatedPlan: ProductionPlan = {
        ...plan,
        status: ProductionPlanStatus.Completed,
        completedAt: new Date().toISOString()
      };

      onPlanReceived(updatedPlan);
      onClose();
    } catch (error: any) {
      console.error('Error completing production:', error);
      const errorMessage = error.response?.data?.message || t('receiveProduction.messages.failedToComplete');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusInfo = (status: ProductionPlanStatus) => {
    switch (status) {
      case ProductionPlanStatus.InProgress:
        return { label: t('receiveProduction.status.inProgress'), color: 'status-in-progress', icon: Clock };
      default:
        return { label: t('receiveProduction.status.unknown'), color: 'status-draft', icon: Package };
    }
  };

  const statusInfo = getStatusInfo(plan.status);
  const StatusIcon = statusInfo.icon;

  const producedMaterialsTableColumns: TableColumn<ProducedMaterial>[] = [
    {
      key: 'material',
      label: t('receiveProduction.fields.material'),
      render: (_, m) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontWeight: 500 }}>{m.materialName}</span>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>({m.materialColor})</span>
        </div>
      )
    },
    {
      key: 'type',
      label: t('receiveProduction.fields.type'),
      render: (_, m) => (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '4px 8px',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--text-sm)',
          fontWeight: 500,
          backgroundColor: m.materialType === MaterialType.RawMaterial ? 'var(--info-100)' :
                         m.materialType === MaterialType.RecyclableMaterial ? 'var(--success-100)' : 'var(--warning-100)',
          color: m.materialType === MaterialType.RawMaterial ? 'var(--info-700)' :
                 m.materialType === MaterialType.RecyclableMaterial ? 'var(--success-700)' : 'var(--warning-700)'
        }}>
          {m.materialType === MaterialType.RawMaterial ? t('receiveProduction.labels.rawMaterial') : 
           m.materialType === MaterialType.RecyclableMaterial ? t('receiveProduction.labels.recyclableMaterial') : t('receiveProduction.labels.finishedProduct')}
        </span>
      )
    },
    {
      key: 'quantity',
      label: t('receiveProduction.fields.quantity'),
      render: (_, m) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Input
            type="number"
            value={m.quantity}
            onChange={(e) => handleUpdateProducedMaterialQuantity(m.id, parseFloat(e.target.value) || 0)}
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
      key: 'actions',
      label: t('common:table.actions'),
      align: 'center',
      render: (_, m) => (
        <DeleteButton
          title={t('receiveProduction.buttons.remove')}
          onClick={() => handleRemoveProducedMaterial(m.id)}
          disabled={isLoading}
        />
      )
    }
  ];

  const materialsUsedTableColumns: TableColumn<typeof plan.requiredMaterials[0] & { totalUsed: number; isAvailable: boolean }>[] = [
    {
      key: 'material',
      label: t('receiveProduction.fields.material'),
      render: (_, m) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontWeight: 500 }}>{m.materialName}</span>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>({m.materialColor})</span>
        </div>
      )
    },
    {
      key: 'requiredPerUnit',
      label: t('receiveProduction.fields.requiredPerUnit'),
      render: (_, m) => `${m.requiredQuantity} ${m.quantityType}`
    },
    {
      key: 'totalUsed',
      label: t('receiveProduction.fields.totalUsed'),
      render: (_, m) => `${m.totalUsed.toFixed(2)} ${m.quantityType}`
    },
    {
      key: 'status',
      label: t('receiveProduction.fields.status'),
      render: (_, m) => (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 8px',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--text-sm)',
          fontWeight: 500,
          backgroundColor: m.isAvailable ? 'var(--success-100)' : 'var(--error-100)',
          color: m.isAvailable ? 'var(--success-700)' : 'var(--error-700)'
        }}>
          {m.isAvailable ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
          {m.isAvailable ? t('receiveProduction.labels.available') : t('receiveProduction.labels.insufficient')}
        </div>
      )
    }
  ];

  const materialsUsedTableData = plan.requiredMaterials.map((material) => {
    const totalUsed = material.requiredQuantity * actualQuantityProduced;
    const isAvailable = material.availableQuantity >= totalUsed;
    return {
      ...material,
      totalUsed,
      isAvailable
    };
  });

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={t('receiveProduction.title')}
      titleIcon={Truck}
      submitText={isLoading ? t('receiveProduction.buttons.completing') : isAddingToInventory ? t('receiveProduction.buttons.addingToInventory') : t('receiveProduction.buttons.completeProduction')}
      cancelText={t('receiveProduction.buttons.cancel')}
      submitVariant="success"
      isSubmitting={isLoading || actualQuantityProduced <= 0 || isAddingToInventory}
      onSubmit={handleSubmit}
      maxWidth="1200px"
      footer={
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', justifyContent: 'space-between', width: '100%' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
            backgroundColor: statusInfo.color === 'status-in-progress' ? 'var(--warning-100)' : 'var(--surface-hover)',
            color: statusInfo.color === 'status-in-progress' ? 'var(--warning-700)' : 'var(--text-primary)'
          }}>
            <StatusIcon size={16} />
            <span>{statusInfo.label}</span>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              {t('receiveProduction.buttons.cancel')}
            </button>
            <button
              type="button"
              className="btn btn-success"
              onClick={handleSubmit}
              disabled={isLoading || actualQuantityProduced <= 0 || isAddingToInventory}
            >
              {isLoading ? t('receiveProduction.buttons.completing') : isAddingToInventory ? t('receiveProduction.buttons.addingToInventory') : t('receiveProduction.buttons.completeProduction')}
            </button>
          </div>
        </div>
      }
    >
      {error && (
        <ErrorMessage
          message={error}
          onDismiss={() => setError(null)}
        />
      )}

      {inventoryUpdateStatus && (
        <div style={{
          padding: 'var(--space-md)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--space-md)',
          backgroundColor: isAddingToInventory ? 'var(--info-50)' : 'var(--success-50)',
          border: `1px solid ${isAddingToInventory ? 'var(--info-200)' : 'var(--success-200)'}`,
          color: isAddingToInventory ? 'var(--info-700)' : 'var(--success-700)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-sm)'
        }}>
          {isAddingToInventory && <div className="loading-spinner" style={{ width: '16px', height: '16px', border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>}
          {inventoryUpdateStatus}
        </div>
      )}

      <Form onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}>

        <ViewSection title={t('receiveProduction.sections.productionPlanOverview')} titleIcon={Package}>
          <ViewGrid>
            <ViewItem>
              <ViewLabel>{t('receiveProduction.fields.planName')}</ViewLabel>
              <ViewValue>{plan.name}</ViewValue>
            </ViewItem>
            <ViewItem>
              <ViewLabel>{t('receiveProduction.fields.targetProduct')}</ViewLabel>
              <ViewValue>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontWeight: 500 }}>{plan.targetProductName}</span>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>({plan.targetProductColor})</span>
                </div>
              </ViewValue>
            </ViewItem>
            <ViewItem>
              <ViewLabel>{t('receiveProduction.fields.startedAt')}</ViewLabel>
              <ViewValue>{plan.startedAt ? formatDateTime(plan.startedAt) : t('receiveProduction.labels.notStarted')}</ViewValue>
            </ViewItem>
            <ViewItem>
              <ViewLabel>{t('receiveProduction.fields.materialsRequired')}</ViewLabel>
              <ViewValue>{plan.requiredMaterials.length} {t('receiveProduction.labels.materials')}</ViewValue>
            </ViewItem>
          </ViewGrid>
        </ViewSection>

        <FormSection title={t('receiveProduction.sections.finalProductionResults')} titleIcon={CheckCircle}>
          <FormGroup>
            <Label htmlFor="actualQuantityProduced">{t('receiveProduction.fields.actualQuantityProduced')} *</Label>
            <Input
              type="number"
              id="actualQuantityProduced"
              value={actualQuantityProduced}
              onChange={(e) => setActualQuantityProduced(parseFloat(e.target.value) || 0)}
              onWheel={handleWheel}
              min="0.01"
              step="0.01"
              required
              disabled={isLoading}
              placeholder={t('receiveProduction.placeholders.actualQuantityProduced')}
            />
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {t('receiveProduction.labels.plannedQuantity')} {plan.quantityToProduce} {t('receiveProduction.labels.units')}
            </div>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="actualProductionTimeMinutes">{t('receiveProduction.fields.actualProductionTimeMinutes')}</Label>
            <Input
              type="number"
              id="actualProductionTimeMinutes"
              value={actualProductionTimeMinutes}
              onChange={(e) => setActualProductionTimeMinutes(parseInt(e.target.value) || 0)}
              onWheel={handleWheel}
              min="0"
              step="1"
              disabled={isLoading}
              placeholder={t('receiveProduction.placeholders.actualProductionTime')}
            />
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {t('receiveProduction.labels.optionalRecordTime')}
            </div>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="notes">{t('receiveProduction.fields.productionNotes')}</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              disabled={isLoading}
              placeholder={t('receiveProduction.placeholders.productionNotes')}
            />
          </FormGroup>
        </FormSection>

        <FormSection title={t('receiveProduction.sections.materialsProduced')} titleIcon={Package}>
          <div style={{ marginBottom: 'var(--space-md)' }}>
            <Checkbox
              checked={useProducedMaterials}
              onChange={(e) => setUseProducedMaterials(e.target.checked)}
              disabled={isLoading}
            >
              {t('receiveProduction.labels.specifyProducedMaterials')}
            </Checkbox>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {useProducedMaterials 
                ? t('receiveProduction.labels.addSpecificMaterials')
                : t('receiveProduction.labels.usePlannedMaterials')
              }
            </div>
          </div>
            
          {useProducedMaterials && (
            <>
              {/* Mode Selector */}
              <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                <button 
                  type="button"
                  className={`btn ${materialMode === 'existing' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setMaterialMode('existing')}
                  disabled={isLoading}
                >
                  {t('receiveProduction.labels.selectExistingMaterial')}
                </button>
                <button 
                  type="button"
                  className={`btn ${materialMode === 'new' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setMaterialMode('new')}
                  disabled={isLoading}
                >
                  {t('receiveProduction.labels.createNewMaterial')}
                </button>
              </div>

              {materialMode === 'existing' ? (
                <FormRow>
                  <div style={{ flex: 2 }}>
                    <FormGroup>
                      <Label htmlFor="currentMaterial">{t('receiveProduction.fields.selectProducedMaterial')}</Label>
                      <Select
                        id="currentMaterial"
                        value={currentMaterial.materialId}
                        onChange={(e) => setCurrentMaterial(prev => ({ ...prev, materialId: parseInt(e.target.value) }))}
                        disabled={isLoading}
                      >
                        <option value={0}>{t('receiveProduction.fields.selectMaterial')}</option>
                        {availableMaterials.map(material => (
                          <option key={material.id} value={material.id}>
                            {material.name} ({material.color}) - {material.quantityType}
                          </option>
                        ))}
                      </Select>
                    </FormGroup>
                  </div>
                  <FormGroup>
                    <Label htmlFor="materialQuantity">{t('receiveProduction.fields.quantityProduced')}</Label>
                    <Input
                      type="number"
                      id="materialQuantity"
                      value={currentMaterial.quantity}
                      onChange={(e) => setCurrentMaterial(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
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
                        onClick={handleAddProducedMaterial}
                        className="btn btn-secondary"
                        disabled={isLoading}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Plus size={16} />
                        {t('receiveProduction.buttons.add')}
                      </button>
                    </FormGroup>
                  </div>
                </FormRow>
              ) : (
                <>
                  <FormRow>
                    <FormGroup>
                      <Label htmlFor="newMaterialName">{t('receiveProduction.fields.materialName')} *</Label>
                      <Input
                        type="text"
                        id="newMaterialName"
                        name="name"
                        value={newMaterialData.name}
                        onChange={handleNewMaterialChange}
                        placeholder={t('receiveProduction.placeholders.materialName')}
                        required
                        disabled={isLoading}
                      />
                    </FormGroup>
                    <FormGroup>
                      <Label htmlFor="newMaterialColor">{t('receiveProduction.fields.color')} *</Label>
                      <Input
                        type="text"
                        id="newMaterialColor"
                        name="color"
                        value={newMaterialData.color}
                        onChange={handleNewMaterialChange}
                        placeholder={t('receiveProduction.placeholders.color')}
                        required
                        disabled={isLoading}
                      />
                    </FormGroup>
                  </FormRow>

                  <FormRow>
                    <FormGroup>
                      <Label htmlFor="newMaterialType">{t('receiveProduction.fields.materialType')} *</Label>
                      <Select
                        id="newMaterialType"
                        name="type"
                        value={newMaterialData.type}
                        onChange={handleNewMaterialChange}
                        required
                        disabled={isLoading}
                      >
                        <option value={MaterialType.RawMaterial}>{t('receiveProduction.labels.rawMaterial')}</option>
                        <option value={MaterialType.RecyclableMaterial}>{t('receiveProduction.labels.recyclableMaterial')}</option>
                        <option value={MaterialType.FinishedProduct}>{t('receiveProduction.labels.finishedProduct')}</option>
                      </Select>
                    </FormGroup>
                    <FormGroup>
                      <Label htmlFor="newMaterialQuantityType">{t('receiveProduction.fields.unitType')} *</Label>
                      <Input
                        type="text"
                        id="newMaterialQuantityType"
                        name="quantityType"
                        value={newMaterialData.quantityType}
                        onChange={handleNewMaterialChange}
                        placeholder={t('receiveProduction.placeholders.unitType')}
                        required
                        disabled={isLoading}
                      />
                    </FormGroup>
                  </FormRow>

                  <FormRow>
                    <FormGroup>
                      <Label htmlFor="newMaterialQuantity">{t('receiveProduction.fields.quantityProduced')} *</Label>
                      <Input
                        type="number"
                        id="newMaterialQuantity"
                        value={currentMaterial.quantity}
                        onChange={(e) => setCurrentMaterial(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                        onWheel={handleWheel}
                        min="0.01"
                        step="0.01"
                        required
                        disabled={isLoading}
                      />
                    </FormGroup>
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                      <FormGroup>
                        <Label>&nbsp;</Label>
                        <button
                          type="button"
                          onClick={handleAddProducedMaterial}
                          className="btn btn-primary"
                          disabled={isLoading}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Plus size={16} />
                          {t('receiveProduction.buttons.createAndAdd')}
                        </button>
                      </FormGroup>
                    </div>
                  </FormRow>

                  <FormGroup>
                    <Label htmlFor="newMaterialDescription">{t('receiveProduction.fields.description')}</Label>
                    <Textarea
                      id="newMaterialDescription"
                      name="description"
                      value={newMaterialData.description}
                      onChange={handleNewMaterialChange}
                      placeholder={t('receiveProduction.placeholders.description')}
                      rows={2}
                      disabled={isLoading}
                    />
                  </FormGroup>
                </>
              )}

              {producedMaterials.length > 0 && (
                <Table
                  columns={producedMaterialsTableColumns}
                  data={producedMaterials}
                  getRowKey={(m) => m.id}
                  showContainer={false}
                />
              )}
            </>
          )}
        </FormSection>


        <FormSection title={t('receiveProduction.sections.materialsUsed')} titleIcon={Package}>
          <Table
            columns={materialsUsedTableColumns}
            data={materialsUsedTableData}
            getRowKey={(_, index) => index.toString()}
            getRowClassName={(m) => !m.isAvailable ? 'insufficient-stock' : ''}
            showContainer={false}
          />
        </FormSection>
      </Form>
    </Modal>
  );
};

export default ReceiveProduction;
