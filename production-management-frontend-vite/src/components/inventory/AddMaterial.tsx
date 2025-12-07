import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Package, Plus, FileText } from 'lucide-react';
import { Modal, Form, FormSection, FormRow, FormGroup, Label, Input, Textarea, Select, ErrorMessage, ViewSection, ViewGrid, ViewItem, ViewLabel, ViewValue } from '../atoms';
import { inventoryApi } from '../../services/api';
import type { RawMaterial, CreateRawMaterialRequest, AddToExistingMaterialRequest, MaterialTypeInfo } from '../../types';
import { MaterialType } from '../../types';

interface AddMaterialProps {
  onClose: () => void;
  onMaterialCreated: (material: RawMaterial) => void;
}

const AddMaterial: React.FC<AddMaterialProps> = ({ onClose, onMaterialCreated }) => {
  const { t } = useTranslation(['inventory', 'common']);
  const [mode, setMode] = useState<'new' | 'existing'>('new');
  const [materialTypes, setMaterialTypes] = useState<MaterialTypeInfo[]>([]);
  const [existingMaterials, setExistingMaterials] = useState<RawMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New material form data
  const [newMaterialData, setNewMaterialData] = useState<CreateRawMaterialRequest>({
    name: '',
    color: '',
    type: MaterialType.RawMaterial,
    quantity: 0,
    quantityType: '',
    minimumStock: 0,
    unitCost: 0,
    description: ''
  });

  // Existing material form data
  const [existingMaterialData, setExistingMaterialData] = useState<AddToExistingMaterialRequest>({
    materialId: 0,
    quantityToAdd: 0,
    newUnitCost: undefined
  });

  const [selectedExistingMaterial, setSelectedExistingMaterial] = useState<RawMaterial | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [typesResponse, materialsResponse] = await Promise.all([
        inventoryApi.getMaterialTypes(),
        inventoryApi.getAllMaterials()
      ]);
      setMaterialTypes(typesResponse.data);
      setExistingMaterials(materialsResponse.data.filter(m => m.isActive));
    } catch (error: any) {
      console.error('Error loading initial data:', error);
      setError(t('form.messages.failedToLoadData'));
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    // Prevent number input from changing value when scrolling
    if (e.currentTarget.type === 'number') {
      e.currentTarget.blur();
    }
  };

  const handleNewMaterialChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setNewMaterialData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleExistingMaterialChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (name === 'materialId') {
      const materialId = parseInt(value);
      const material = existingMaterials.find(m => m.id === materialId);
      setSelectedExistingMaterial(material || null);
      setExistingMaterialData(prev => ({ ...prev, materialId }));
    } else {
      setExistingMaterialData(prev => ({
        ...prev,
        [name]: type === 'number' ? (value ? parseFloat(value) : undefined) : value
      }));
    }
  };

  const handleMaterialTypeSelect = (materialType: MaterialTypeInfo) => {
    setNewMaterialData(prev => ({
      ...prev,
      name: materialType.name,
      color: materialType.color,
      type: MaterialType.RawMaterial,
      quantityType: materialType.quantityType,
      description: materialType.description || ''
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let response;
      
      if (mode === 'new') {
        response = await inventoryApi.createMaterial(newMaterialData);
      } else {
        response = await inventoryApi.addToExisting(existingMaterialData);
      }
      
      onMaterialCreated(response.data);
      onClose();
    } catch (error: any) {
      console.error('Error adding material:', error);
      const errorMessage = error.response?.data?.message || t('form.messages.failedToAdd');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = () => {
    if (mode === 'new') {
      return newMaterialData.name && 
             newMaterialData.color && 
             newMaterialData.quantityType && 
             newMaterialData.quantity > 0;
    } else {
      return existingMaterialData.materialId > 0 && 
             existingMaterialData.quantityToAdd > 0;
    }
  };

  const commonQuantityTypes = ['kg', 'liters', 'pieces', 'meters', 'grams', 'tons'];

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={t('form.addTitle')}
      titleIcon={Package}
      submitText={isLoading ? t('form.buttons.adding') : mode === 'new' ? t('form.buttons.createMaterial') : t('form.buttons.addToStock')}
      cancelText={t('form.buttons.cancel')}
      submitVariant="primary"
      isSubmitting={isLoading || !isFormValid()}
      onSubmit={handleSubmit}
      maxWidth="900px"
    >
      {error && (
        <ErrorMessage
          message={error}
          onDismiss={() => setError(null)}
        />
      )}

      {/* Mode Selector */}
      <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
        <button 
          type="button"
          className={`btn ${mode === 'new' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setMode('new')}
          disabled={isLoading}
        >
          <Plus size={16} style={{ marginRight: '4px' }} />
          {t('form.modes.createNew')}
        </button>
        <button 
          type="button"
          className={`btn ${mode === 'existing' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setMode('existing')}
          disabled={isLoading}
        >
          <Package size={16} style={{ marginRight: '4px' }} />
          {t('form.modes.addToExisting')}
        </button>
      </div>

      <Form onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}>
        {mode === 'new' ? (
          <>
            {/* Quick Select from Existing Types */}
            {materialTypes.length > 0 && (
              <FormSection title={t('form.sections.quickSelect')} titleIcon={FileText}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
                  gap: 'var(--space-md)',
                  marginBottom: 'var(--space-lg)'
                }}>
                  {materialTypes.map((type, index) => (
                    <button
                      key={index}
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => handleMaterialTypeSelect(type)}
                      disabled={isLoading}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        padding: 'var(--space-md)',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ fontWeight: 500, marginBottom: '4px' }}>{type.name}</div>
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                        <span>{type.color}</span>
                        <span> ({type.quantityType})</span>
                      </div>
                    </button>
                  ))}
                </div>
                <div style={{ 
                  textAlign: 'center', 
                  padding: 'var(--space-md)', 
                  color: 'var(--text-secondary)',
                  fontSize: 'var(--text-sm)'
                }}>
                  {t('form.sections.orCreateNew')}
                </div>
              </FormSection>
            )}

            <FormSection title={t('form.sections.materialDetails')} titleIcon={Package}>
              <FormRow>
                <FormGroup>
                  <Label htmlFor="name">{t('form.fields.materialName')} *</Label>
                  <Input
                    type="text"
                    id="name"
                    name="name"
                    value={newMaterialData.name}
                    onChange={handleNewMaterialChange}
                    placeholder={t('form.placeholders.materialName')}
                    required
                    disabled={isLoading}
                  />
                </FormGroup>
                <FormGroup>
                  <Label htmlFor="color">{t('form.fields.color')} *</Label>
                  <Input
                    type="text"
                    id="color"
                    name="color"
                    value={newMaterialData.color}
                    onChange={handleNewMaterialChange}
                    placeholder={t('form.placeholders.color')}
                    required
                    disabled={isLoading}
                  />
                </FormGroup>
              </FormRow>

              <FormRow>
                <FormGroup>
                  <Label htmlFor="type">{t('form.fields.materialType')} *</Label>
                  <Select
                    id="type"
                    name="type"
                    value={newMaterialData.type}
                    onChange={handleNewMaterialChange}
                    required
                    disabled={isLoading}
                  >
                    <option value={MaterialType.RawMaterial}>{t('filters.rawMaterials')}</option>
                    <option value={MaterialType.RecyclableMaterial}>{t('filters.recyclableMaterials')}</option>
                    <option value={MaterialType.FinishedProduct}>{t('filters.finishedProducts')}</option>
                  </Select>
                </FormGroup>
                <FormGroup>
                  <Label htmlFor="quantityType">{t('form.fields.unitType')} *</Label>
                  <Input
                    type="text"
                    id="quantityType"
                    name="quantityType"
                    value={newMaterialData.quantityType}
                    onChange={handleNewMaterialChange}
                    placeholder={t('form.placeholders.unitType')}
                    required
                    disabled={isLoading}
                    list="quantityTypeOptions"
                  />
                  <datalist id="quantityTypeOptions">
                    {commonQuantityTypes.map(type => (
                      <option key={type} value={type} />
                    ))}
                  </datalist>
                </FormGroup>
              </FormRow>

              <FormRow>
                <FormGroup>
                  <Label htmlFor="quantity">{t('form.fields.initialQuantity')} *</Label>
                  <Input
                    type="number"
                    id="quantity"
                    name="quantity"
                    value={newMaterialData.quantity}
                    onChange={handleNewMaterialChange}
                    onWheel={handleWheel}
                    min="0"
                    step="0.01"
                    required
                    disabled={isLoading}
                  />
                </FormGroup>
                <FormGroup>
                  <Label htmlFor="minimumStock">{t('form.fields.minimumStockLevel')}</Label>
                  <Input
                    type="number"
                    id="minimumStock"
                    name="minimumStock"
                    value={newMaterialData.minimumStock}
                    onChange={handleNewMaterialChange}
                    onWheel={handleWheel}
                    min="0"
                    step="0.01"
                    disabled={isLoading}
                  />
                </FormGroup>
              </FormRow>

              <FormGroup>
                <Label htmlFor="description">{t('form.fields.description')}</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={newMaterialData.description}
                  onChange={handleNewMaterialChange}
                  placeholder={t('form.placeholders.description')}
                  rows={3}
                  disabled={isLoading}
                />
              </FormGroup>
            </FormSection>
          </>
        ) : (
          <FormSection title={t('form.sections.addToExisting')} titleIcon={Package}>
            <FormGroup>
              <Label htmlFor="materialId">{t('form.fields.selectExistingMaterial')} *</Label>
              <Select
                id="materialId"
                name="materialId"
                value={existingMaterialData.materialId}
                onChange={handleExistingMaterialChange}
                required
                disabled={isLoading}
              >
                <option value={0}>{t('form.placeholders.chooseMaterial')}</option>
                {existingMaterials.map(material => (
                  <option key={material.id} value={material.id}>
                    {material.name} ({material.color}) - {t('form.labels.current')}: {material.quantity} {material.quantityType}
                    {material.isLowStock && ` - ${t('status.lowStock').toUpperCase()}!`}
                  </option>
                ))}
              </Select>
            </FormGroup>

            {selectedExistingMaterial && (
              <ViewSection title={t('form.labels.selectedMaterial')} titleIcon={Package}>
                <ViewGrid>
                  <ViewItem>
                    <ViewLabel>{t('form.labels.name')}</ViewLabel>
                    <ViewValue>{selectedExistingMaterial.name}</ViewValue>
                  </ViewItem>
                  <ViewItem>
                    <ViewLabel>{t('form.labels.color')}</ViewLabel>
                    <ViewValue>{selectedExistingMaterial.color}</ViewValue>
                  </ViewItem>
                  <ViewItem>
                    <ViewLabel>{t('form.labels.type')}</ViewLabel>
                    <ViewValue>
                      {selectedExistingMaterial.type === MaterialType.RawMaterial 
                        ? t('filters.rawMaterials')
                        : selectedExistingMaterial.type === MaterialType.RecyclableMaterial
                        ? t('filters.recyclableMaterials')
                        : t('filters.finishedProducts')}
                    </ViewValue>
                  </ViewItem>
                  <ViewItem>
                    <ViewLabel>{t('form.labels.currentStock')}</ViewLabel>
                    <ViewValue>
                      <span style={{ color: selectedExistingMaterial.isLowStock ? 'var(--warning-700)' : 'inherit' }}>
                        {selectedExistingMaterial.quantity} {selectedExistingMaterial.quantityType}
                        {selectedExistingMaterial.isLowStock && ` (${t('form.labels.lowStock')})`}
                      </span>
                    </ViewValue>
                  </ViewItem>
                </ViewGrid>
              </ViewSection>
            )}

            <FormGroup>
              <Label htmlFor="quantityToAdd">{t('form.fields.quantityToAdd')} *</Label>
              <Input
                type="number"
                id="quantityToAdd"
                name="quantityToAdd"
                value={existingMaterialData.quantityToAdd}
                onChange={handleExistingMaterialChange}
                onWheel={handleWheel}
                min="0.01"
                step="0.01"
                placeholder={selectedExistingMaterial ? `${t('common:buttons.add', { defaultValue: 'Add' })} ${selectedExistingMaterial.quantityType}` : t('form.placeholders.quantity')}
                required
                disabled={isLoading}
              />
            </FormGroup>
          </FormSection>
        )}
      </Form>
    </Modal>
  );
};

export default AddMaterial;
