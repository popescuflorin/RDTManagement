import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Package, Plus, CheckCircle, AlertTriangle } from 'lucide-react';
import { Modal, Form, FormSection, FormRow, FormGroup, Label, Input, Textarea, Select, ErrorMessage, Table, Checkbox, DeleteButton } from '../atoms';
import { productionPlanApi, inventoryApi } from '../../services/api';
import type { 
  CreateProductionPlanRequest, 
  ProductionPlan, 
  RawMaterial,
  CreateProductionPlanMaterialRequest,
  UpdateProductTemplateRequest,
  ProductTemplateMaterial
} from '../../types';
import { MaterialType } from '../../types';
import type { TableColumn } from '../atoms';

interface CreateProductionPlanProps {
  onClose: () => void;
  onPlanCreated: (plan: ProductionPlan) => void;
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

const CreateProductionPlan: React.FC<CreateProductionPlanProps> = ({ onClose, onPlanCreated }) => {
  const { t } = useTranslation(['production', 'common']);
  const [finishedProducts, setFinishedProducts] = useState<RawMaterial[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [materialsError, setMaterialsError] = useState<string | null>(null);
  const [showNewProductForm, setShowNewProductForm] = useState(false);
  const [templateLoaded, setTemplateLoaded] = useState(false);
  const [originalTemplate, setOriginalTemplate] = useState<MaterialSelection[]>([]);
  const [originalEstimatedTime, setOriginalEstimatedTime] = useState(0);
  const [updateTemplate, setUpdateTemplate] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetProductId: 0,
    quantityToProduce: 1,
    plannedStartDate: new Date().toISOString().split('T')[0], // Default to today
    estimatedProductionTimeMinutes: 60,
    notes: ''
  });

  const [newProduct, setNewProduct] = useState({
    name: '',
    color: '',
    quantityType: 'pieces',
    description: '',
    minimumStock: 0
  });

  const [selectedMaterials, setSelectedMaterials] = useState<MaterialSelection[]>([]);
  const [currentMaterial, setCurrentMaterial] = useState({
    rawMaterialId: 0,
    requiredQuantity: 1
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [finishedProductsResponse, rawMaterialsResponse] = await Promise.all([
        inventoryApi.getAllMaterialsIncludingInactive(),
        inventoryApi.getAllMaterialsIncludingInactive()
      ]);

      const finishedProds = finishedProductsResponse.data.filter(
        (m: RawMaterial) => m.type === MaterialType.FinishedProduct && m.isActive
      );
      const rawMats = rawMaterialsResponse.data.filter(
        (m: RawMaterial) => m.type === MaterialType.RawMaterial && m.isActive
      );

      setFinishedProducts(finishedProds);
      setRawMaterials(rawMats);
    } catch (error: any) {
      console.error('Error loading data:', error);
      setError(t('createPlan.messages.failedToLoadMaterials'));
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    // Prevent number input from changing value when scrolling
    if (e.currentTarget.type === 'number') {
      e.currentTarget.blur();
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Handle product selection - check if "new" was selected
    if (name === 'targetProductId') {
      if (value === 'new') {
        setShowNewProductForm(true);
        setFormData(prev => ({ ...prev, targetProductId: 0 }));
        setSelectedMaterials([]);
        setTemplateLoaded(false);
        return;
      } else {
        setShowNewProductForm(false);
        const productId = parseInt(value) || 0;
        setFormData(prev => ({ ...prev, targetProductId: productId }));
        
        // Load template if product is selected
        if (productId > 0) {
          await loadProductTemplate(productId);
        } else {
          setSelectedMaterials([]);
          setTemplateLoaded(false);
        }
        return;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const loadProductTemplate = async (productId: number) => {
    try {
      const response = await productionPlanApi.getProductTemplate(productId);
      const template = response.data;
      
      // Load materials from template
      const materials: MaterialSelection[] = template.requiredMaterials.map((m: ProductTemplateMaterial) => ({
        id: Date.now().toString() + '-' + m.rawMaterialId,
        rawMaterialId: m.rawMaterialId,
        materialName: m.materialName,
        materialColor: m.materialColor,
        quantityType: m.quantityType,
        requiredQuantity: m.requiredQuantity,
        availableQuantity: m.availableQuantity,
        unitCost: m.unitCost
      }));
      
      setSelectedMaterials(materials);
      setOriginalTemplate(materials); // Save original for comparison
      setOriginalEstimatedTime(template.estimatedProductionTimeMinutes);
      setTemplateLoaded(true);
      setUpdateTemplate(false); // Reset checkbox
      
      // Update estimated production time
      if (template.estimatedProductionTimeMinutes > 0) {
        setFormData(prev => ({
          ...prev,
          estimatedProductionTimeMinutes: template.estimatedProductionTimeMinutes
        }));
      }
    } catch (error: any) {
      // If no template found, that's okay - user can add materials manually
      console.log('No template found for product, user will add materials manually');
      setSelectedMaterials([]);
      setOriginalTemplate([]);
      setOriginalEstimatedTime(0);
      setTemplateLoaded(false);
      setUpdateTemplate(false);
    }
  };

  const handleNewProductChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setNewProduct(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleAddMaterial = () => {
    if (currentMaterial.rawMaterialId === 0 || currentMaterial.requiredQuantity <= 0) {
      setMaterialsError(t('createPlan.messages.pleaseSelectMaterialAndQuantity'));
      return;
    }

    const material = rawMaterials.find(m => m.id === currentMaterial.rawMaterialId);
    if (!material) return;

    // Check if material already added
    if (selectedMaterials.some(m => m.rawMaterialId === currentMaterial.rawMaterialId)) {
      setMaterialsError(t('createPlan.messages.materialAlreadyAdded'));
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

  const hasTemplateChanged = (): boolean => {
    if (!templateLoaded || originalTemplate.length === 0) return false;

    // Check if estimated time changed
    if (formData.estimatedProductionTimeMinutes !== originalEstimatedTime) return true;

    // Check if material count changed
    if (selectedMaterials.length !== originalTemplate.length) return true;

    // Check if any material changed
    for (const selected of selectedMaterials) {
      const original = originalTemplate.find(m => m.rawMaterialId === selected.rawMaterialId);
      if (!original) return true; // New material added
      if (original.requiredQuantity !== selected.requiredQuantity) return true; // Quantity changed
    }

    // Check if any material was removed
    for (const original of originalTemplate) {
      const selected = selectedMaterials.find(m => m.rawMaterialId === original.rawMaterialId);
      if (!selected) return true; // Material removed
    }

    return false;
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (selectedMaterials.length === 0) {
        setMaterialsError(t('createPlan.messages.pleaseAddAtLeastOneMaterial'));
        setIsLoading(false);
        return;
      }

      const requiredMaterials: CreateProductionPlanMaterialRequest[] = selectedMaterials.map(m => ({
        rawMaterialId: m.rawMaterialId,
        requiredQuantity: m.requiredQuantity
      }));

      const request: CreateProductionPlanRequest = {
        name: formData.name,
        description: formData.description,
        quantityToProduce: formData.quantityToProduce,
        plannedStartDate: formData.plannedStartDate || undefined,
        estimatedProductionTimeMinutes: formData.estimatedProductionTimeMinutes,
        notes: formData.notes || undefined,
        requiredMaterials
      };

      if (showNewProductForm) {
        // Creating a new product
        if (!newProduct.name || !newProduct.color || !newProduct.quantityType) {
          setError(t('createPlan.messages.pleaseFillAllRequiredFields'));
          setIsLoading(false);
          return;
        }
        request.newFinishedProduct = newProduct;
      } else {
        // Using existing product
        if (formData.targetProductId === 0) {
          setError(t('createPlan.messages.pleaseSelectFinishedProduct'));
          setIsLoading(false);
          return;
        }
        request.targetProductId = formData.targetProductId;
      }

      const response = await productionPlanApi.createPlan(request);
      
      // Update template if user opted in and template was modified
      if (updateTemplate && templateLoaded && hasTemplateChanged() && formData.targetProductId > 0) {
        try {
          const templateUpdateRequest: UpdateProductTemplateRequest = {
            estimatedProductionTimeMinutes: formData.estimatedProductionTimeMinutes,
            requiredMaterials: selectedMaterials.map(m => ({
              rawMaterialId: m.rawMaterialId,
              requiredQuantity: m.requiredQuantity
            }))
          };
          await productionPlanApi.updateProductTemplate(formData.targetProductId, templateUpdateRequest);
        } catch (templateError) {
          console.error('Error updating template:', templateError);
          // Don't fail the whole operation if template update fails
        }
      }
      
      onPlanCreated(response.data);
      onClose();
    } catch (error: any) {
      console.error('Error creating production plan:', error);
      const errorMessage = error.response?.data?.message || t('createPlan.messages.failedToCreate');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const commonQuantityTypes = ['pieces', 'kg', 'liters', 'meters', 'grams', 'tons'];

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
      title={t('createPlan.title')}
      titleIcon={FileText}
      submitText={isLoading ? t('createPlan.buttons.creating') : t('createPlan.buttons.createProductionPlan')}
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

        <FormSection title={t('createPlan.sections.targetProduct')} titleIcon={Package}>
          <FormGroup>
            <Label htmlFor="targetProductId">{t('createPlan.fields.selectFinishedProduct')} *</Label>
            <Select
              id="targetProductId"
              name="targetProductId"
              value={showNewProductForm ? 'new' : formData.targetProductId}
              onChange={handleInputChange}
              required
              disabled={isLoading}
            >
              <option value={0}>{t('createPlan.fields.selectProduct')}</option>
              {finishedProducts.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.color}) - {t('createPlan.labels.currentStock')} {product.quantity} {product.quantityType}
                </option>
              ))}
              <option value="new">{t('createPlan.fields.createNewProduct')}</option>
            </Select>
          </FormGroup>

          {showNewProductForm && (
            <>
              <FormRow>
                <FormGroup>
                  <Label htmlFor="newProductName">{t('createPlan.fields.productName')} *</Label>
                  <Input
                    type="text"
                    id="newProductName"
                    name="name"
                    value={newProduct.name}
                    onChange={handleNewProductChange}
                    placeholder={t('createPlan.placeholders.productName')}
                    required
                    disabled={isLoading}
                  />
                </FormGroup>
                <FormGroup>
                  <Label htmlFor="newProductColor">{t('createPlan.fields.color')} *</Label>
                  <Input
                    type="text"
                    id="newProductColor"
                    name="color"
                    value={newProduct.color}
                    onChange={handleNewProductChange}
                    placeholder={t('createPlan.placeholders.color')}
                    required
                    disabled={isLoading}
                  />
                </FormGroup>
              </FormRow>
              <FormRow>
                <FormGroup>
                  <Label htmlFor="newProductQuantityType">{t('createPlan.fields.unitType')} *</Label>
                  <Input
                    type="text"
                    id="newProductQuantityType"
                    name="quantityType"
                    value={newProduct.quantityType}
                    onChange={handleNewProductChange}
                    placeholder={t('createPlan.placeholders.unitType')}
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
                <FormGroup>
                  <Label htmlFor="newProductMinimumStock">{t('createPlan.fields.minimumStock')}</Label>
                  <Input
                    type="number"
                    id="newProductMinimumStock"
                    name="minimumStock"
                    value={newProduct.minimumStock}
                    onChange={handleNewProductChange}
                    onWheel={handleWheel}
                    min="0"
                    step="1"
                    disabled={isLoading}
                  />
                </FormGroup>
              </FormRow>
              <FormGroup>
                <Label htmlFor="newProductDescription">{t('createPlan.fields.description')}</Label>
                <Textarea
                  id="newProductDescription"
                  name="description"
                  value={newProduct.description}
                  onChange={handleNewProductChange}
                  placeholder={t('createPlan.placeholders.description')}
                  rows={2}
                  disabled={isLoading}
                />
              </FormGroup>
            </>
          )}
        </FormSection>

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

        <FormSection 
          title={t('createPlan.sections.requiredMaterials')}
          titleIcon={Package}
        >
          {templateLoaded && (
            <div style={{ marginBottom: 'var(--space-md)' }}>
              <span style={{
                padding: '4px 8px',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                backgroundColor: 'var(--info-100)',
                color: 'var(--info-700)'
              }}>
                {t('createPlan.labels.templateLoaded')}
              </span>
            </div>
          )}
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

        {templateLoaded && hasTemplateChanged() && (
          <div style={{
            padding: 'var(--space-md)',
            backgroundColor: 'var(--info-50)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--info-200)',
            marginTop: 'var(--space-lg)'
          }}>
            <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
              <span style={{ fontSize: 'var(--text-lg)' }}>ℹ️</span>
              <div>
                <strong style={{ display: 'block', marginBottom: 'var(--space-xs)' }}>
                  {t('createPlan.labels.templateChangesDetected')}
                </strong>
                <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                  {t('createPlan.labels.templateChangesDescription')}
                </p>
              </div>
            </div>
            <Checkbox
              checked={updateTemplate}
              onChange={(e) => setUpdateTemplate(e.target.checked)}
              disabled={isLoading}
            >
              {t('createPlan.labels.updateTemplate')}
            </Checkbox>
          </div>
        )}
      </Form>
    </Modal>
  );
};

export default CreateProductionPlan;

