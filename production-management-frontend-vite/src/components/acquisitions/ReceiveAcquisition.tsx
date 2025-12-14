import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { acquisitionApi } from '../../services/api';
import type { Acquisition, ReceiveAcquisitionRequest } from '../../types';
import { AcquisitionType } from '../../types';
import { Package, FileText, Truck, Building2, UserCircle } from 'lucide-react';
import { Modal, Form, FormSection, FormRow, FormGroup, Label, Input, ErrorMessage, ViewSection, ViewGrid, ViewItem, ViewLabel, ViewValue } from '../atoms';

interface ReceiveAcquisitionProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  acquisition: Acquisition;
}

interface ReceivedItem {
  id: number;
  rawMaterialId: number;
  name: string;
  color: string;
  description: string;
  orderedQuantity: number;
  receivedQuantity: number;
  unitOfMeasure: string;
}

const ReceiveAcquisition: React.FC<ReceiveAcquisitionProps> = ({
  isOpen,
  onClose,
  onSuccess,
  acquisition
}) => {
  const { t } = useTranslation(['acquisitions', 'common']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ReceivedItem[]>([]);

  useEffect(() => {
    if (isOpen && acquisition) {
      populateItems();
    }
  }, [isOpen, acquisition]);

  const populateItems = () => {
    // Initialize received items with ordered quantities
    const receivedItems: ReceivedItem[] = acquisition.items.map(item => ({
      id: item.id,
      rawMaterialId: item.rawMaterialId,
      name: item.rawMaterialName,
      color: item.rawMaterialColor,
      description: '', // Not stored in acquisition items
      orderedQuantity: item.orderedQuantity,
      receivedQuantity: item.receivedQuantity ?? item.orderedQuantity, // Use received if exists, otherwise ordered
      unitOfMeasure: item.quantityType
    }));
    setItems(receivedItems);
  };

  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    // Prevent number input from changing value when scrolling
    if (e.currentTarget.type === 'number') {
      e.currentTarget.blur();
    }
  };

  const handleUpdateReceivedQuantity = (index: number, quantity: number) => {
    setItems(items.map((item, i) => 
      i === index ? { ...item, receivedQuantity: quantity } : item
    ));
  };

  const handleSubmit = async () => {
    // Validate that all received quantities are valid
    const hasInvalidQuantity = items.some(item => item.receivedQuantity < 0);
    if (hasInvalidQuantity) {
      setError(t('receive.messages.quantitiesCannotBeNegative'));
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const receiveRequest: ReceiveAcquisitionRequest = {
        items: items.map(item => ({
          acquisitionItemId: item.id,
          receivedQuantity: item.receivedQuantity,
          actualUnitCost: 0 // You can add this field if needed
        }))
      };

      await acquisitionApi.receiveAcquisition(acquisition.id, receiveRequest);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || t('receive.messages.failedToReceive'));
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

  const getModalTitle = () => {
    if (acquisition.type === AcquisitionType.RawMaterials) {
      return t('receive.title.rawMaterials');
    }
    return t('receive.title.recyclableMaterials');
  };

  const getSubmitButtonLabel = () => {
    if (acquisition.type === AcquisitionType.RawMaterials) {
      return t('receive.buttons.receiveAndAdd');
    }
    return t('receive.buttons.markReadyForProcessing');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={getModalTitle()}
      titleIcon={Package}
      submitText={isLoading ? t('receive.buttons.processing') : getSubmitButtonLabel()}
      cancelText={t('receive.buttons.cancel')}
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

        {/* Info Message for Recyclable Materials */}
        {acquisition.type === AcquisitionType.RecyclableMaterials && (
          <div style={{ 
            padding: 'var(--space-md)', 
            backgroundColor: 'var(--info-50)', 
            border: '1px solid var(--info-200)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-lg)',
            color: 'var(--info-700)'
          }}>
            <strong>{t('common:labels.notes', { defaultValue: 'Note' })}:</strong> {t('receive.messages.recyclableMaterialsNote')}
          </div>
        )}

        {/* Acquisition Details - Compact Summary */}
        <ViewSection title={t('receive.sections.acquisitionDetails')} titleIcon={FileText}>
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
              <ViewLabel>
                <UserCircle size={14} style={{display: 'inline', marginRight: '4px'}} />
                {t('view.labels.assignedTo')}
              </ViewLabel>
              <ViewValue>{acquisition.assignedToUserName || t('view.labels.unassigned')}</ViewValue>
            </ViewItem>
            <ViewItem>
              <ViewLabel>{t('view.labels.createdBy')}</ViewLabel>
              <ViewValue>{acquisition.createdByUserName} {t('view.labels.on')} {new Date(acquisition.createdAt).toLocaleDateString()}</ViewValue>
            </ViewItem>
            {acquisition.dueDate && (
              <ViewItem>
                <ViewLabel>{t('view.labels.dueDate')}</ViewLabel>
                <ViewValue>{new Date(acquisition.dueDate).toLocaleDateString()}</ViewValue>
              </ViewItem>
            )}
            {acquisition.notes && (
              <ViewItem>
                <ViewLabel>{t('view.labels.notes')}</ViewLabel>
                <ViewValue>{acquisition.notes}</ViewValue>
              </ViewItem>
            )}
          </ViewGrid>
        </ViewSection>

        {/* Transport & Supplier Details - Compact */}
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
                  {acquisition.transportNumberPlate && (
                    <ViewItem>
                      <ViewLabel>{t('view.labels.numberPlate')}</ViewLabel>
                      <ViewValue>{acquisition.transportNumberPlate}</ViewValue>
                    </ViewItem>
                  )}
                  {acquisition.transportPhoneNumber && (
                    <ViewItem>
                      <ViewLabel>{t('view.labels.phone')}</ViewLabel>
                      <ViewValue>{acquisition.transportPhoneNumber}</ViewValue>
                    </ViewItem>
                  )}
                  {acquisition.transportDate && (
                    <ViewItem>
                      <ViewLabel>{t('view.labels.date')}</ViewLabel>
                      <ViewValue>{new Date(acquisition.transportDate).toLocaleDateString()}</ViewValue>
                    </ViewItem>
                  )}
                  {acquisition.transportNotes && (
                    <ViewItem>
                      <ViewLabel>{t('view.labels.transportNotes')}</ViewLabel>
                      <ViewValue>{acquisition.transportNotes}</ViewValue>
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

        {/* Materials - With Received Quantity */}
        <FormSection title={t('receive.sections.materialsToReceive')} titleIcon={Package}>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 'var(--space-md)' 
          }}>
            {items.map((item, index) => (
              <div key={item.id} style={{ 
                padding: 'var(--space-lg)', 
                border: '1px solid var(--border)', 
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--surface)'
              }}>
                <div style={{ 
                  display: 'flex',
                  gap: 'var(--space-md)',
                  alignItems: 'flex-start'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontWeight: 600, 
                      fontSize: 'var(--text-base)', 
                      marginBottom: 'var(--space-xs)' 
                    }}>
                      {item.name}
                    </div>
                    <div style={{ 
                      fontSize: 'var(--text-sm)', 
                      color: 'var(--text-secondary)' 
                    }}>
                      {t('form.itemCard.color')}: {item.color}
                    </div>
                  </div>
                  <div style={{ flex: 2 }}>
                    <FormRow>
                      <FormGroup>
                        <Label>{t('receive.labels.orderedQuantity')}</Label>
                        <Input
                          type="number"
                          value={item.orderedQuantity}
                          disabled
                          className="disabled-field"
                        />
                      </FormGroup>
                      <FormGroup>
                        <Label>{t('receive.labels.receivedQuantity')} *</Label>
                        <Input
                          type="number"
                          value={item.receivedQuantity}
                          onChange={(e) => handleUpdateReceivedQuantity(index, parseFloat(e.target.value) || 0)}
                          onWheel={handleWheel}
                          min="0"
                          step="0.01"
                          placeholder={t('receive.labels.enterReceivedQuantity')}
                        />
                      </FormGroup>
                    </FormRow>
                    <FormRow>
                      <FormGroup>
                        <Label>{t('receive.labels.unitOfMeasure')}</Label>
                        <Input
                          type="text"
                          value={item.unitOfMeasure}
                          disabled
                          className="disabled-field"
                        />
                      </FormGroup>
                    </FormRow>
                    <div style={{ 
                      marginTop: 'var(--space-md)', 
                      padding: 'var(--space-sm)', 
                      borderRadius: 'var(--radius-sm)',
                      textAlign: 'center',
                      fontWeight: 600
                    }}>
                      <div className={`quantity-status ${item.receivedQuantity === item.orderedQuantity ? 'complete' : item.receivedQuantity > item.orderedQuantity ? 'excess' : 'partial'}`}>
                        {item.receivedQuantity === item.orderedQuantity && t('receive.labels.complete')}
                        {item.receivedQuantity > item.orderedQuantity && t('receive.labels.excessReceived')}
                        {item.receivedQuantity < item.orderedQuantity && t('receive.labels.partialDelivery')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Reception Summary */}
          <div style={{ 
            marginTop: 'var(--space-lg)', 
            padding: 'var(--space-md)', 
            display: 'flex',
            gap: 'var(--space-xl)',
            flexWrap: 'wrap',
            borderTop: '1px solid var(--border)',
            backgroundColor: 'var(--background-secondary)',
            borderRadius: 'var(--radius-md)'
          }}>
            <div>
              <strong>{t('receive.labels.totalItems')}:</strong> {items.length}
            </div>
            <div>
              <strong>{t('receive.labels.totalOrdered')}:</strong> {items.reduce((sum, item) => sum + item.orderedQuantity, 0).toFixed(2)} {t('receive.labels.units')}
            </div>
            <div>
              <strong>{t('receive.labels.totalReceiving')}:</strong> {items.reduce((sum, item) => sum + item.receivedQuantity, 0).toFixed(2)} {t('receive.labels.units')}
            </div>
          </div>
        </FormSection>
      </Form>
    </Modal>
  );
};

export default ReceiveAcquisition;

