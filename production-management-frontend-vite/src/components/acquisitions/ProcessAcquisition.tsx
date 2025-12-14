import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { acquisitionApi, inventoryApi } from '../../services/api';
import type { Acquisition, RawMaterial } from '../../types';
import { AcquisitionType, MaterialType } from '../../types';
import { Package, FileText, Truck, Building2, Plus, Trash2 } from 'lucide-react';
import { Modal, Form, FormRow, FormGroup, Label, Input, Select, ErrorMessage, ViewSection, ViewGrid, ViewItem, ViewLabel, ViewValue, Button, FormSection } from '../atoms';

interface ProcessAcquisitionProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  acquisition: Acquisition;
}

interface RecyclableItem {
  id: number;
  rawMaterialId: number;
  name: string;
  color: string;
  quantity: number;
  unitOfMeasure: string;
}

interface ProcessedMaterial {
  id: string; // Temporary ID for UI
  recyclableItemId: number;
  rawMaterialId: number | null;
  name: string;
  color: string;
  description: string;
  quantity: number;
  unitOfMeasure: string;
  isNew: boolean;
}

const ProcessAcquisition: React.FC<ProcessAcquisitionProps> = ({
  isOpen,
  onClose,
  onSuccess,
  acquisition
}) => {
  const { t } = useTranslation(['acquisitions', 'common']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [recyclableItems, setRecyclableItems] = useState<RecyclableItem[]>([]);
  const [processedMaterials, setProcessedMaterials] = useState<ProcessedMaterial[]>([]);
  const [availableRawMaterials, setAvailableRawMaterials] = useState<RawMaterial[]>([]);

  useEffect(() => {
    if (isOpen && acquisition) {
      loadData();
    }
  }, [isOpen, acquisition]);

  const loadData = async () => {
    try {
      // Load recyclable items from acquisition
      const items: RecyclableItem[] = acquisition.items.map(item => ({
        id: item.id,
        rawMaterialId: item.rawMaterialId,
        name: item.rawMaterialName,
        color: item.rawMaterialColor,
        quantity: item.quantity,
        unitOfMeasure: item.quantityType
      }));
      setRecyclableItems(items);

      // Load available raw materials (for dropdown)
      const rawMaterialsResponse = await inventoryApi.getAllMaterials();
      // Filter to show only raw materials (not recyclables)
      const rawMaterialsOnly = rawMaterialsResponse.data.filter(
        (material: RawMaterial) => material.type === MaterialType.RawMaterial
      );
      setAvailableRawMaterials(rawMaterialsOnly);
    } catch (err: any) {
      setError(err.response?.data?.message || t('process.messages.failedToLoadData'));
    }
  };

  const handleAddProcessedMaterial = (recyclableItem: RecyclableItem) => {
    const newMaterial: ProcessedMaterial = {
      id: `temp-${Date.now()}-${Math.random()}`,
      recyclableItemId: recyclableItem.id,
      rawMaterialId: null,
      name: '',
      color: '',
      description: '',
      quantity: 0,
      unitOfMeasure: recyclableItem.unitOfMeasure,
      isNew: true
    };
    setProcessedMaterials([...processedMaterials, newMaterial]);
  };

  const handleRemoveProcessedMaterial = (id: string) => {
    setProcessedMaterials(processedMaterials.filter(m => m.id !== id));
  };

  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    // Prevent number input from changing value when scrolling
    if (e.currentTarget.type === 'number') {
      e.currentTarget.blur();
    }
  };

  const handleUpdateProcessedMaterial = (id: string, updates: Partial<ProcessedMaterial>) => {
    setProcessedMaterials(processedMaterials.map(m => 
      m.id === id ? { ...m, ...updates } : m
    ));
    // Clear processing error when user updates material
    if (processingError) {
      setProcessingError(null);
    }
  };

  const handleSelectExistingRawMaterial = (id: string, rawMaterialId: number) => {
    const selectedMaterial = availableRawMaterials.find(m => m.id === rawMaterialId);
    if (selectedMaterial) {
      handleUpdateProcessedMaterial(id, {
        rawMaterialId: rawMaterialId,
        name: selectedMaterial.name,
        color: selectedMaterial.color,
        description: selectedMaterial.description || '',
        unitOfMeasure: selectedMaterial.quantityType,
        isNew: false
      });
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (processedMaterials.length === 0) {
      setProcessingError(t('process.messages.pleaseAddAtLeastOne'));
      return;
    }

    // Validate all materials have required fields
    for (const material of processedMaterials) {
      if (!material.name || !material.color || material.quantity <= 0) {
        setProcessingError(t('process.messages.allProcessedMaterialsMustHave'));
        return;
      }
    }

    try {
      setIsLoading(true);
      setError(null);
      setProcessingError(null);

      const processRequest = {
        acquisitionId: acquisition.id,
        materials: processedMaterials.map(m => ({
          recyclableItemId: m.recyclableItemId,
          rawMaterialId: m.rawMaterialId || 0, // 0 means create new
          name: m.name,
          color: m.color,
          description: m.description,
          quantity: m.quantity,
          unitOfMeasure: m.unitOfMeasure
        }))
      };

      await acquisitionApi.processAcquisition(acquisition.id, processRequest);
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || t('process.messages.failedToProcess'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  const getTypeLabel = (type: AcquisitionType) => {
    return type === AcquisitionType.RawMaterials ? t('type.rawMaterials') : t('type.recyclableMaterials');
  };

  const getTotalProcessedForItem = (itemId: number): number => {
    return processedMaterials
      .filter(m => m.recyclableItemId === itemId)
      .reduce((sum, m) => sum + m.quantity, 0);
  };

  const getRemainingQuantity = (item: RecyclableItem): number => {
    return item.quantity - getTotalProcessedForItem(item.id);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('process.title')}
      titleIcon={Package}
      submitText={isLoading ? t('process.buttons.processing') : t('process.buttons.completeProcessing')}
      cancelText={t('process.buttons.cancel')}
      submitVariant="primary"
      isSubmitting={isLoading}
      onSubmit={handleSubmit}
      maxWidth="900px"
      closeOnBackdropClick={false}
    >
      <Form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        {error && (
          <ErrorMessage
            message={error}
            onDismiss={() => setError(null)}
          />
        )}

        {/* Info Message */}
        <div style={{ 
          padding: 'var(--space-md)', 
          backgroundColor: 'var(--info-50)', 
          border: '1px solid var(--info-200)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--space-lg)',
          color: 'var(--info-700)'
        }}>
          <strong>{t('process.messages.processingInstructionsLabel', { defaultValue: 'Processing Instructions' })}:</strong> {t('process.messages.processingInstructions')}
        </div>

        {/* Acquisition Details - Compact Summary */}
        <ViewSection title={t('process.sections.acquisitionDetails')} titleIcon={FileText}>
          <ViewGrid>
            <ViewItem>
              <ViewLabel>{t('view.labels.title')}</ViewLabel>
              <ViewValue>{acquisition.title}</ViewValue>
            </ViewItem>
            <ViewItem>
              <ViewLabel>{t('view.labels.type')}</ViewLabel>
              <ViewValue>{getTypeLabel(acquisition.type)}</ViewValue>
            </ViewItem>
            {acquisition.description && (
              <ViewItem>
                <ViewLabel>{t('view.labels.description')}</ViewLabel>
                <ViewValue>{acquisition.description}</ViewValue>
              </ViewItem>
            )}
            <ViewItem>
              <ViewLabel>{t('process.labels.assignedTo')}</ViewLabel>
              <ViewValue>{acquisition.assignedToUserName || t('view.labels.unassigned')}</ViewValue>
            </ViewItem>
            <ViewItem>
              <ViewLabel>{t('process.labels.receivedBy')}</ViewLabel>
              <ViewValue>
                {acquisition.receivedByUserName || t('process.labels.na')} 
                {acquisition.receivedAt ? ` ${t('view.labels.on')} ${new Date(acquisition.receivedAt).toLocaleDateString()}` : ''}
              </ViewValue>
            </ViewItem>
          </ViewGrid>
        </ViewSection>

        {/* Transport & Supplier Details */}
        {(acquisition.transportCarName || acquisition.supplierName) && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: 'var(--space-xl)',
            marginBottom: 'var(--space-xl)'
          }}>
            {/* Transport Details */}
            {acquisition.transportCarName && (
              <ViewSection title={t('view.sections.transport')} titleIcon={Truck}>
                <ViewGrid>
                  <ViewItem>
                    <ViewLabel>{t('view.labels.vehicle')}</ViewLabel>
                    <ViewValue>{acquisition.transportCarName}</ViewValue>
                  </ViewItem>
                  <ViewItem>
                    <ViewLabel>{t('view.labels.numberPlate')}</ViewLabel>
                    <ViewValue>{acquisition.transportNumberPlate || t('view.labels.notSet')}</ViewValue>
                  </ViewItem>
                  {acquisition.transportPhoneNumber && (
                    <ViewItem>
                      <ViewLabel>{t('view.labels.phone')}</ViewLabel>
                      <ViewValue>{acquisition.transportPhoneNumber}</ViewValue>
                    </ViewItem>
                  )}
                </ViewGrid>
              </ViewSection>
            )}

            {/* Supplier Details */}
            {acquisition.supplierName && (
              <ViewSection title={t('view.sections.supplier')} titleIcon={Building2}>
                <ViewGrid>
                  <ViewItem>
                    <ViewLabel>{t('view.labels.name')}</ViewLabel>
                    <ViewValue>{acquisition.supplierName}</ViewValue>
                  </ViewItem>
                  {acquisition.supplierContact && (
                    <ViewItem>
                      <ViewLabel>{t('view.labels.contact')}</ViewLabel>
                      <ViewValue>{acquisition.supplierContact}</ViewValue>
                    </ViewItem>
                  )}
                </ViewGrid>
              </ViewSection>
            )}
          </div>
        )}

        {/* Recyclable Materials & Processing */}
        <FormSection title={t('process.sections.processRecyclableMaterials')} titleIcon={Package}>
          {/* Processing Error Message */}
          {processingError && (
            <ErrorMessage
              message={processingError}
              onDismiss={() => setProcessingError(null)}
            />
          )}
          
          {recyclableItems.map((item) => {
            const remainingQty = getRemainingQuantity(item);
            const itemProcessedMaterials = processedMaterials.filter(m => m.recyclableItemId === item.id);
            
            return (
              <div key={item.id} style={{ 
                marginBottom: 'var(--space-xl)',
                padding: 'var(--space-lg)', 
                border: '1px solid var(--border)', 
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--surface)'
              }}>
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 'var(--space-lg)',
                  paddingBottom: 'var(--space-md)',
                  borderBottom: '1px solid var(--border)'
                }}>
                  <div>
                    <h4 style={{ 
                      margin: 0,
                      marginBottom: 'var(--space-xs)',
                      fontSize: 'var(--text-lg)',
                      fontWeight: 600,
                      color: 'var(--text-primary)'
                    }}>
                      {item.name}
                    </h4>
                    <p style={{ 
                      margin: 0,
                      fontSize: 'var(--text-sm)',
                      color: 'var(--text-secondary)'
                    }}>
                      {t('process.labels.color')}: {item.color} | {t('process.labels.available')}: <strong>{item.quantity} {item.unitOfMeasure}</strong>
                    </p>
                  </div>
                  <div style={{
                    padding: 'var(--space-sm) var(--space-md)',
                    backgroundColor: remainingQty === 0 ? 'var(--success-50)' : remainingQty < 0 ? 'var(--warning-50)' : 'var(--info-50)',
                    border: `1px solid ${remainingQty === 0 ? 'var(--success-200)' : remainingQty < 0 ? 'var(--warning-200)' : 'var(--info-200)'}`,
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'right'
                  }}>
                    <span style={{ 
                      fontSize: 'var(--text-sm)',
                      color: remainingQty === 0 ? 'var(--success-700)' : remainingQty < 0 ? 'var(--warning-700)' : 'var(--info-700)'
                    }}>
                      {t('process.labels.remaining')}: <strong>{remainingQty} {item.unitOfMeasure}</strong>
                      {remainingQty < 0 && <span style={{ marginLeft: '8px', fontSize: '0.85em' }}>{t('process.labels.overProcessingAllowed')}</span>}
                    </span>
                  </div>
                </div>

                {/* Processed Materials from this Recyclable */}
                {itemProcessedMaterials.length > 0 && (
                  <div style={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-md)',
                    marginBottom: 'var(--space-md)'
                  }}>
                    {itemProcessedMaterials.map((material) => (
                      <div key={material.id} style={{ 
                        padding: 'var(--space-md)', 
                        border: '1px solid var(--border)', 
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--background-secondary)'
                      }}>
                        <FormRow>
                          <FormGroup>
                            <Label>{t('process.labels.selectRawMaterialOrCreate')}</Label>
                            <Select
                              value={material.rawMaterialId?.toString() || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === 'new') {
                                  handleUpdateProcessedMaterial(material.id, {
                                    rawMaterialId: null,
                                    name: '',
                                    color: '',
                                    description: '',
                                    isNew: true
                                  });
                                } else if (value) {
                                  handleSelectExistingRawMaterial(material.id, parseInt(value));
                                }
                              }}
                            >
                              <option value="">{t('process.labels.selectOrCreateNew')}</option>
                              <option value="new">{t('process.labels.createNewRawMaterial')}</option>
                              <optgroup label={t('process.labels.existingRawMaterials')}>
                                {availableRawMaterials.map(rm => (
                                  <option key={rm.id} value={rm.id}>
                                    {rm.name} ({rm.color})
                                  </option>
                                ))}
                              </optgroup>
                            </Select>
                          </FormGroup>
                          <FormGroup>
                            <Label>{t('process.labels.quantity')}</Label>
                            <Input
                              type="number"
                              value={material.quantity}
                              onChange={(e) => handleUpdateProcessedMaterial(material.id, { quantity: parseFloat(e.target.value) || 0 })}
                              onWheel={handleWheel}
                              min="0"
                              step="0.01"
                              required
                            />
                          </FormGroup>
                        </FormRow>

                        {material.isNew && (
                          <>
                            <FormRow>
                              <FormGroup>
                                <Label>{t('process.labels.materialName')}</Label>
                                <Input
                                  type="text"
                                  value={material.name}
                                  onChange={(e) => handleUpdateProcessedMaterial(material.id, { name: e.target.value })}
                                  placeholder={t('process.labels.enterMaterialName')}
                                  required
                                />
                              </FormGroup>
                              <FormGroup>
                                <Label>{t('process.labels.color')}</Label>
                                <Input
                                  type="text"
                                  value={material.color}
                                  onChange={(e) => handleUpdateProcessedMaterial(material.id, { color: e.target.value })}
                                  placeholder={t('process.labels.enterColor')}
                                  required
                                />
                              </FormGroup>
                            </FormRow>
                            <FormRow>
                              <FormGroup>
                                <Label>{t('process.labels.unitOfMeasure')}</Label>
                                <Input
                                  type="text"
                                  value={material.unitOfMeasure}
                                  onChange={(e) => handleUpdateProcessedMaterial(material.id, { unitOfMeasure: e.target.value })}
                                  placeholder={t('form.placeholders.unitExample')}
                                  required
                                />
                              </FormGroup>
                              <FormGroup>
                                <Label>{t('process.labels.descriptionOptional')}</Label>
                                <Input
                                  type="text"
                                  value={material.description}
                                  onChange={(e) => handleUpdateProcessedMaterial(material.id, { description: e.target.value })}
                                  placeholder={t('process.labels.enterDescription')}
                                />
                              </FormGroup>
                            </FormRow>
                          </>
                        )}

                        {!material.isNew && material.rawMaterialId && (
                          <div style={{ 
                            padding: 'var(--space-sm)', 
                            backgroundColor: 'var(--success-50)',
                            border: '1px solid var(--success-200)',
                            borderRadius: 'var(--radius-sm)',
                            marginTop: 'var(--space-md)'
                          }}>
                            <p style={{ 
                              margin: 0,
                              fontSize: 'var(--text-sm)',
                              color: 'var(--success-700)'
                            }}>
                              <strong>{t('process.labels.selected')}:</strong> {material.name} ({material.color}) - {material.unitOfMeasure}
                            </p>
                          </div>
                        )}

                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => handleRemoveProcessedMaterial(material.id)}
                          style={{ marginTop: 'var(--space-md)' }}
                        >
                          <Trash2 size={16} /> {t('process.labels.remove')}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Processed Material Button */}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handleAddProcessedMaterial(item)}
                >
                  <Plus size={16} /> {t('process.labels.addProcessedMaterial')}
                </Button>
              </div>
            );
          })}
        </FormSection>

      </Form>
    </Modal>
  );
};

export default ProcessAcquisition;

