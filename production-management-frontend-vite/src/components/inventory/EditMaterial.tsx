import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Package, FileText } from 'lucide-react';
import { Modal, Form, FormSection, FormRow, FormGroup, Label, Input, Textarea, Select, ErrorMessage, ViewSection, ViewGrid, ViewItem, ViewLabel, ViewValue } from '../atoms';
import { inventoryApi } from '../../services/api';
import type { RawMaterial, UpdateRawMaterialRequest } from '../../types';
import { MaterialType } from '../../types';

interface EditMaterialProps {
  material: RawMaterial;
  onClose: () => void;
  onMaterialUpdated: (updatedMaterial: RawMaterial) => void;
}

const EditMaterial: React.FC<EditMaterialProps> = ({ material, onClose, onMaterialUpdated }) => {
  const { t } = useTranslation(['inventory', 'common']);
  const [formData, setFormData] = useState<UpdateRawMaterialRequest>({
    name: material.name,
    color: material.color,
    type: material.type,
    quantity: material.quantity,
    quantityType: material.quantityType,
    minimumStock: material.minimumStock,
    unitCost: material.unitCost,
    description: material.description || '',
    isActive: material.isActive
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    // Prevent number input from changing value when scrolling
    if (e.currentTarget.type === 'number') {
      e.currentTarget.blur();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : 
              type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              value
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await inventoryApi.updateMaterial(material.id, formData);
      onMaterialUpdated(response.data);
      onClose();
    } catch (error: any) {
      console.error('Error updating material:', error);
      const errorMessage = error.response?.data?.message || t('edit.messages.failedToUpdate');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const commonQuantityTypes = ['kg', 'liters', 'pieces', 'meters', 'grams', 'tons'];

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={t('edit.title')}
      titleIcon={Edit}
      submitText={isLoading ? t('edit.buttons.updating') : t('edit.buttons.updateMaterial')}
      cancelText={t('edit.buttons.cancel')}
      submitVariant="primary"
      isSubmitting={isLoading}
      onSubmit={handleSubmit}
      maxWidth="800px"
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
        <ViewSection title={t('edit.currentMaterial')} titleIcon={Package}>
          <ViewGrid>
            <ViewItem>
              <ViewLabel>{t('form.labels.name')}</ViewLabel>
              <ViewValue>{material.name} ({material.color})</ViewValue>
            </ViewItem>
            <ViewItem>
              <ViewLabel>{t('form.labels.type')}</ViewLabel>
              <ViewValue>
                {material.type === MaterialType.RawMaterial 
                  ? t('filters.rawMaterials')
                  : material.type === MaterialType.RecyclableMaterial
                  ? t('filters.recyclableMaterials')
                  : t('filters.finishedProducts')}
              </ViewValue>
            </ViewItem>
            <ViewItem>
              <ViewLabel>{t('edit.fields.lastUpdated')}</ViewLabel>
              <ViewValue>{new Date(material.updatedAt).toLocaleDateString()}</ViewValue>
            </ViewItem>
          </ViewGrid>
        </ViewSection>

        <FormSection title={t('edit.materialDetails')} titleIcon={FileText}>
          <FormRow>
            <FormGroup>
              <Label htmlFor="name">{t('form.fields.materialName')} *</Label>
              <Input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
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
                value={formData.color}
                onChange={handleInputChange}
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
                value={formData.type}
                onChange={handleInputChange}
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
                value={formData.quantityType}
                onChange={handleInputChange}
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
              <Label htmlFor="quantity">{t('edit.fields.currentQuantity')} *</Label>
              <Input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
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
                value={formData.minimumStock}
                onChange={handleInputChange}
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
              value={formData.description}
              onChange={handleInputChange}
              placeholder={t('form.placeholders.description')}
              rows={3}
              disabled={isLoading}
            />
          </FormGroup>

          {/* Stock Status Indicators */}
          <div style={{
            padding: 'var(--space-md)',
            borderRadius: 'var(--radius-md)',
            marginTop: 'var(--space-md)',
            backgroundColor: formData.quantity <= formData.minimumStock ? 'var(--warning-50)' : 'var(--success-50)',
            border: `1px solid ${formData.quantity <= formData.minimumStock ? 'var(--warning-200)' : 'var(--success-200)'}`,
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)'
          }}>
            <span style={{ fontSize: 'var(--text-lg)' }}>
              {formData.quantity <= formData.minimumStock ? '⚠️' : '✅'}
            </span>
            <span style={{
              color: formData.quantity <= formData.minimumStock ? 'var(--warning-700)' : 'var(--success-700)',
              fontSize: 'var(--text-sm)'
            }}>
              {formData.quantity <= formData.minimumStock 
                ? t('edit.stockIndicators.lowStockWarning', { quantity: formData.quantity, minimum: formData.minimumStock })
                : t('edit.stockIndicators.stockLevelOk', { quantity: formData.quantity, minimum: formData.minimumStock })
              }
            </span>
          </div>
        </FormSection>
      </Form>
    </Modal>
  );
};

export default EditMaterial;
