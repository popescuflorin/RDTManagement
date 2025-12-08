import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { acquisitionApi, orderApi, transportApi } from '../../services/api';
import type { Acquisition, Order, Transport, UpdateAcquisitionRequest, UpdateOrderRequest } from '../../types';
import { AcquisitionStatus, OrderStatus } from '../../types';
import { Truck, FileText } from 'lucide-react';
import { Modal, Form, FormSection, FormRow, FormGroup, Label, Input, Textarea, Checkbox, ErrorMessage, Loader, Select, ViewValue, Button } from '../atoms';

interface CreateTransportRecordProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateTransportRecord: React.FC<CreateTransportRecordProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { t } = useTranslation(['transports', 'common']);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [draftAcquisitions, setDraftAcquisitions] = useState<Acquisition[]>([]);
  const [draftOrders, setDraftOrders] = useState<Order[]>([]);
  const [transports, setTransports] = useState<Transport[]>([]);
  
  const [selectedAcquisitionIds, setSelectedAcquisitionIds] = useState<Set<number>>(new Set());
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<number>>(new Set());
  const [selectedTransportId, setSelectedTransportId] = useState<number | null>(null);
  const [transportDate, setTransportDate] = useState('');
  const [transportNotes, setTransportNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadData();
    } else {
      // Reset form when modal closes
      setSelectedAcquisitionIds(new Set());
      setSelectedOrderIds(new Set());
      setSelectedTransportId(null);
      setTransportDate('');
      setTransportNotes('');
      setError(null);
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      setIsLoadingData(true);
      setError(null);

      // Fetch draft acquisitions and orders, and all transports
      const [acquisitionsResponse, ordersResponse, transportsResponse] = await Promise.all([
        acquisitionApi.getAllAcquisitions(),
        orderApi.getAllOrders(),
        transportApi.getAllTransports()
      ]);

      // Filter for draft status
      const drafts = acquisitionsResponse.data.filter(a => a.status === AcquisitionStatus.Draft);
      const orderDrafts = ordersResponse.data.filter(o => o.status === OrderStatus.Draft);

      setDraftAcquisitions(drafts);
      setDraftOrders(orderDrafts);
      setTransports(transportsResponse.data);
    } catch (err: any) {
      setError(err.response?.data?.message || t('createTransportRecord.messages.failedToLoadData'));
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleAcquisitionToggle = (acquisitionId: number) => {
    setSelectedAcquisitionIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(acquisitionId)) {
        newSet.delete(acquisitionId);
      } else {
        newSet.add(acquisitionId);
      }
      return newSet;
    });
  };

  const handleOrderToggle = (orderId: number) => {
    setSelectedOrderIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const handleSelectAllAcquisitions = () => {
    if (selectedAcquisitionIds.size === draftAcquisitions.length) {
      setSelectedAcquisitionIds(new Set());
    } else {
      setSelectedAcquisitionIds(new Set(draftAcquisitions.map(a => a.id)));
    }
  };

  const handleSelectAllOrders = () => {
    if (selectedOrderIds.size === draftOrders.length) {
      setSelectedOrderIds(new Set());
    } else {
      setSelectedOrderIds(new Set(draftOrders.map(o => o.id)));
    }
  };

  const handleSubmit = async () => {
    const totalSelected = selectedAcquisitionIds.size + selectedOrderIds.size;
    if (totalSelected === 0 || !selectedTransportId) {
      setError(t('createTransportRecord.messages.pleaseSelectEntityAndTransport'));
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Update all selected acquisitions
      const acquisitionPromises = Array.from(selectedAcquisitionIds).map(async (acquisitionId) => {
        const acquisition = draftAcquisitions.find(a => a.id === acquisitionId);
        if (!acquisition) {
          throw new Error(`Acquisition ${acquisitionId} not found`);
        }

        const updateRequest: UpdateAcquisitionRequest = {
          title: acquisition.title,
          description: acquisition.description,
          assignedToUserId: acquisition.assignedToUserId,
          supplierId: acquisition.supplierId,
          supplierContact: acquisition.supplierContact,
          notes: acquisition.notes,
          dueDate: acquisition.dueDate,
          transportId: selectedTransportId,
          transportDate: transportDate || undefined,
          transportNotes: transportNotes.trim() || undefined,
          items: acquisition.items.map(item => ({
            id: item.id,
            rawMaterialId: item.rawMaterialId,
            name: item.rawMaterialName,
            color: item.rawMaterialColor,
            quantity: item.orderedQuantity,
            quantityType: item.quantityType
          }))
        };

        return acquisitionApi.updateAcquisition(acquisitionId, updateRequest);
      });

      // Update all selected orders
      const orderPromises = Array.from(selectedOrderIds).map(async (orderId) => {
        const order = draftOrders.find(o => o.id === orderId);
        if (!order) {
          throw new Error(`Order ${orderId} not found`);
        }

        const updateRequest: UpdateOrderRequest = {
          clientId: order.clientId,
          description: order.description,
          notes: order.notes,
          status: order.status,
          orderDate: order.orderDate,
          expectedDeliveryDate: order.expectedDeliveryDate,
          transportId: selectedTransportId,
          transportDate: transportDate || undefined,
          transportNotes: transportNotes.trim() || undefined,
          orderMaterials: order.orderMaterials.map(material => ({
            rawMaterialId: material.rawMaterialId,
            quantity: material.quantity,
            unitPrice: material.unitPrice
          }))
        };

        return orderApi.updateOrder(orderId, updateRequest);
      });

      // Execute all updates in parallel
      await Promise.all([...acquisitionPromises, ...orderPromises]);

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || t('createTransportRecord.messages.failedToAssign'));
    } finally {
      setIsLoading(false);
    }
  };

  const selectedTransport = transports.find(t => t.id === selectedTransportId);
  const totalSelected = selectedAcquisitionIds.size + selectedOrderIds.size;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('createTransportRecord.title')}
      titleIcon={Truck}
      submitText={isLoading 
        ? t('createTransportRecord.labels.assigningTo', { count: totalSelected, defaultValue: 'Assigning...' })
        : t('createTransportRecord.labels.assignTransportTo', { count: totalSelected, defaultValue: 'Assign Transport' })}
      cancelText={t('createTransportRecord.buttons.cancel', { defaultValue: 'Cancel' })}
      submitVariant="primary"
      isSubmitting={isLoading || isLoadingData || totalSelected === 0 || !selectedTransportId}
      onSubmit={handleSubmit}
      maxWidth="900px"
      showCancel={true}
    >
      <Form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          {error && (
            <ErrorMessage
              message={error}
              onDismiss={() => setError(null)}
            />
          )}

          {isLoadingData ? (
             <Loader message={t('createTransportRecord.messages.loadingDraftEntities')} />
          ) : (
            <>
              {/* Entity Selection */}
              <FormSection title={t('createTransportRecord.sections.selectEntities')} titleIcon={FileText}>
                {totalSelected > 0 && (
                  <ViewValue style={{ 
                    marginBottom: 'var(--space-md)', 
                    fontSize: 'var(--text-sm)', 
                    fontWeight: 600,
                    color: 'var(--primary-600)'
                  }}> {t('createTransportRecord.labels.entitiesSelected', { count: totalSelected })}
                  </ViewValue>
                )}

                {/* Acquisitions Section */}
                {draftAcquisitions.length > 0 && (
                  <FormSection 
                      title={t('createTransportRecord.labels.acquisitions') + ' (' + draftAcquisitions.length + ')'} 
                      titleIcon={FileText}>
                    <div className="entity-list">
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-end',
                      marginTop: 'var(--space-md)',
                      paddingTop: 'var(--space-sm)',
                      borderTop: '1px solid var(--border)',
                      justifyContent: 'flex-end'
                    }}>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleSelectAllAcquisitions}
                      >
                        {selectedAcquisitionIds.size === draftAcquisitions.length ? t('createTransportRecord.labels.deselectAll') : t('createTransportRecord.labels.selectAll')}
                      </Button>
                    </div>

                      {draftAcquisitions.map(acq => (
                        <div
                          key={acq.id}
                          className={`entity-item ${selectedAcquisitionIds.has(acq.id) ? 'selected' : ''}`}
                          onClick={() => handleAcquisitionToggle(acq.id)}
                          style={{ marginBottom: 'var(--space-sm)' }}
                        >
                          <Checkbox
                            checked={selectedAcquisitionIds.has(acq.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleAcquisitionToggle(acq.id);
                            }}
                            wrapperClassName="entity-checkbox-wrapper"
                            label={`#${acq.id} - ${acq.title} - ${acq.type === 0 ? t('createTransportRecord.labels.rawMaterials') : t('createTransportRecord.labels.recyclableMaterials')} • ${acq.totalItems} ${t('createTransportRecord.labels.items')}`}
                          />
                        </div>
                      ))}
                    </div>
                  </FormSection>
                )}

                {/* Orders Section */}
                {draftOrders.length > 0 && (
                  <FormSection 
                  title={t('createTransportRecord.labels.orders') + ' (' + draftAcquisitions.length + ')'} 
                  titleIcon={FileText}>
                    <div className="entity-list">
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-end',
                        marginTop: 'var(--space-md)',
                        paddingTop: 'var(--space-sm)',
                        borderTop: '1px solid var(--border)',
                        justifyContent: 'flex-end'
                      }}>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={handleSelectAllOrders}
                        >
                          {selectedOrderIds.size === draftOrders.length ? t('createTransportRecord.labels.deselectAll') : t('createTransportRecord.labels.selectAll')}
                        </Button>
                      </div>

                  {draftOrders.map(order => (
                    <div
                      key={order.id}
                      className={`entity-item ${selectedOrderIds.has(order.id) ? 'selected' : ''}`}
                      onClick={() => handleAcquisitionToggle(order.id)}
                      style={{ marginBottom: 'var(--space-sm)' }}
                    >
                      <Checkbox
                        checked={selectedOrderIds.has(order.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleOrderToggle(order.id);
                        }}
                        wrapperClassName="entity-checkbox-wrapper"
                        label={`#${order.id} - ${order.clientName} - ${order.orderMaterials.length} ${t('createTransportRecord.labels.items')} • ${order.totalValue.toFixed(2)}`}
                      />
                    </div>
                  ))}
                </div>
                </FormSection>
                )}

                {draftAcquisitions.length === 0 && draftOrders.length === 0 && (
                  <ViewValue style={{
                    textAlign: 'center',
                    padding: 'var(--space-xl)',
                    color: 'var(--text-secondary)',
                    fontStyle: 'italic'
                  }}>
                    {t('createTransportRecord.messages.noDraftEntities')}
                  </ViewValue>
                )}
              </FormSection>

              {/* Transport Selection */}
              {totalSelected > 0 && (
                <FormSection title={t('createTransportRecord.sections.selectTransport')} titleIcon={Truck}>
                  <FormRow>
                    <FormGroup>
                      <Label htmlFor="transportId" required>
                        {t('createTransportRecord.fields.transportVehicle')}
                      </Label>
                      <Select
                        id="transportId"
                        value={selectedTransportId || ''}
                        onChange={(e) => setSelectedTransportId(Number(e.target.value) || null)}
                        required
                      >
                        <option value="">{t('createTransportRecord.placeholders.selectTransport')}</option>
                        {transports.map(transport => (
                          <option key={transport.id} value={transport.id}>
                            {transport.carName} {transport.numberPlate ? `(${transport.numberPlate})` : ''} - {transport.phoneNumber}
                          </option>
                        ))}
                      </Select>
                      {selectedTransport && (
                        <ViewValue style={{ 
                          marginTop: 'var(--space-xs)', 
                          fontSize: 'var(--text-xs)', 
                          color: 'var(--text-secondary)',
                          lineHeight: 'var(--line-height-relaxed)'
                        }}>
                          <strong>{t('createTransportRecord.labels.car')}</strong> {selectedTransport.carName} | 
                          <strong> {t('createTransportRecord.labels.plate')}</strong> {selectedTransport.numberPlate || t('createTransportRecord.labels.notAvailable')} | 
                          <strong> {t('createTransportRecord.labels.phone')}</strong> {selectedTransport.phoneNumber}
                        </ViewValue>
                      )}
                    </FormGroup>
                  </FormRow>

                  <FormRow>
                    <FormGroup>
                      <Label htmlFor="transportDate">
                        {t('createTransportRecord.fields.transportDate')}
                      </Label>
                      <Input
                        type="date"
                        id="transportDate"
                        value={transportDate}
                        onChange={(e) => setTransportDate(e.target.value)}
                      />
                    </FormGroup>
                  </FormRow>

                  <FormRow>
                    <FormGroup fullWidth>
                      <Label htmlFor="transportNotes">
                        {t('createTransportRecord.fields.transportNotes')}
                      </Label>
                      <Textarea
                        id="transportNotes"
                        value={transportNotes}
                        onChange={(e) => setTransportNotes(e.target.value)}
                        placeholder={t('createTransportRecord.placeholders.transportNotes')}
                        rows={3}
                      />
                    </FormGroup>
                  </FormRow>
                </FormSection>
              )}
            </>
          )}
      </Form>
    </Modal>
  );
};

export default CreateTransportRecord;

