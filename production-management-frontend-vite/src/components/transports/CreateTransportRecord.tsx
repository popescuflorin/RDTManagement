import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { acquisitionApi, orderApi, transportApi } from '../../services/api';
import type { Acquisition, Order, Transport, UpdateAcquisitionRequest, UpdateOrderRequest } from '../../types';
import { AcquisitionStatus, OrderStatus } from '../../types';
import { Truck, FileText, ClipboardList, Loader2 } from 'lucide-react';
import { Modal, Form, FormSection, FormRow, FormGroup, Label, Input, Textarea, Checkbox } from '../atoms';

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
            <div className="error-message">
              {error}
              <button type="button" onClick={() => setError(null)}>×</button>
            </div>
          )}

          {isLoadingData ? (
            <div className="loading-container">
              <Loader2 size={32} className="animate-spin" />
              <p>{t('createTransportRecord.messages.loadingDraftEntities')}</p>
            </div>
          ) : (
            <>
              {/* Entity Selection */}
              <div className="form-section">
                <h3>{t('createTransportRecord.sections.selectEntities')}</h3>
                {totalSelected > 0 && (
                  <div className="selection-summary">
                    <strong>{totalSelected}</strong> {t('createTransportRecord.labels.entitiesSelected', { count: totalSelected })}
                  </div>
                )}

                {/* Acquisitions Section */}
                {draftAcquisitions.length > 0 && (
                  <div className="entity-category">
                    <div className="entity-category-header">
                      <h4>
                        <FileText size={18} />
                        {t('createTransportRecord.labels.acquisitions')} ({draftAcquisitions.length})
                      </h4>
                      <button
                        type="button"
                        className="select-all-btn"
                        onClick={handleSelectAllAcquisitions}
                      >
                        {selectedAcquisitionIds.size === draftAcquisitions.length ? t('createTransportRecord.labels.deselectAll') : t('createTransportRecord.labels.selectAll')}
                      </button>
                    </div>
                    <div className="entity-list">
                      {draftAcquisitions.map(acq => (
                        <div
                          key={acq.id}
                          className={`entity-item ${selectedAcquisitionIds.has(acq.id) ? 'selected' : ''}`}
                          onClick={() => handleAcquisitionToggle(acq.id)}
                        >
                          <Checkbox
                            checked={selectedAcquisitionIds.has(acq.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleAcquisitionToggle(acq.id);
                            }}
                            wrapperClassName="entity-checkbox-wrapper"
                          />
                          <div className="entity-info">
                            <strong>#{acq.id} - {acq.title}</strong>
                            <span className="entity-details">
                              {acq.type === 0 ? t('createTransportRecord.labels.rawMaterials') : t('createTransportRecord.labels.recyclableMaterials')} • {acq.totalItems} {t('createTransportRecord.labels.items')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Orders Section */}
                {draftOrders.length > 0 && (
                  <div className="entity-category">
                    <div className="entity-category-header">
                      <h4>
                        <ClipboardList size={18} />
                        {t('createTransportRecord.labels.orders')} ({draftOrders.length})
                      </h4>
                      <button
                        type="button"
                        className="select-all-btn"
                        onClick={handleSelectAllOrders}
                      >
                        {selectedOrderIds.size === draftOrders.length ? t('createTransportRecord.labels.deselectAll') : t('createTransportRecord.labels.selectAll')}
                      </button>
                    </div>
                    <div className="entity-list">
                      {draftOrders.map(order => (
                        <div
                          key={order.id}
                          className={`entity-item ${selectedOrderIds.has(order.id) ? 'selected' : ''}`}
                          onClick={() => handleOrderToggle(order.id)}
                        >
                          <Checkbox
                            checked={selectedOrderIds.has(order.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleOrderToggle(order.id);
                            }}
                            wrapperClassName="entity-checkbox-wrapper"
                          />
                          <div className="entity-info">
                            <strong>#{order.id} - {order.clientName}</strong>
                            <span className="entity-details">
                              {order.orderMaterials.length} {t('createTransportRecord.labels.items')} • ${order.totalValue.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {draftAcquisitions.length === 0 && draftOrders.length === 0 && (
                  <div className="no-entities">{t('createTransportRecord.messages.noDraftEntities')}</div>
                )}
              </div>

              {/* Transport Selection */}
              {totalSelected > 0 && (
                <FormSection>
                  <FormRow>
                    <FormGroup>
                      <Label htmlFor="transportId" required>
                        {t('createTransportRecord.fields.transportVehicle')}
                      </Label>
                      <select
                        id="transportId"
                        className="form-input form-input-md"
                        value={selectedTransportId || ''}
                        onChange={(e) => setSelectedTransportId(Number(e.target.value) || null)}
                        required
                        style={{
                          padding: 'var(--space-sm) var(--space-md)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-md)',
                          fontSize: 'var(--text-sm)',
                          fontFamily: 'inherit',
                          backgroundColor: 'var(--surface)',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          transition: 'border-color var(--transition-fast)',
                          width: '100%'
                        }}
                      >
                        <option value="">{t('createTransportRecord.placeholders.selectTransport')}</option>
                        {transports.map(transport => (
                          <option key={transport.id} value={transport.id}>
                            {transport.carName} {transport.numberPlate ? `(${transport.numberPlate})` : ''} - {transport.phoneNumber}
                          </option>
                        ))}
                      </select>
                      {selectedTransport && (
                        <div className="transport-details" style={{ marginTop: 'var(--space-xs)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                          <strong>{t('createTransportRecord.labels.car')}</strong> {selectedTransport.carName} | 
                          <strong> {t('createTransportRecord.labels.plate')}</strong> {selectedTransport.numberPlate || t('createTransportRecord.labels.notAvailable')} | 
                          <strong> {t('createTransportRecord.labels.phone')}</strong> {selectedTransport.phoneNumber}
                        </div>
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

