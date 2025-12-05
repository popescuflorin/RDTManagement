import React, { useState, useEffect } from 'react';
import { acquisitionApi, orderApi, transportApi } from '../../services/api';
import type { Acquisition, Order, Transport, UpdateAcquisitionRequest, UpdateOrderRequest } from '../../types';
import { AcquisitionStatus, OrderStatus } from '../../types';
import { X, Truck, FileText, ClipboardList, Loader2 } from 'lucide-react';
import './CreateTransportRecord.css';

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
      setError(err.response?.data?.message || 'Failed to load data');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const totalSelected = selectedAcquisitionIds.size + selectedOrderIds.size;
    if (totalSelected === 0 || !selectedTransportId) {
      setError('Please select at least one entity and a transport');
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
      setError(err.response?.data?.message || 'Failed to assign transport to one or more entities');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  if (!isOpen) return null;

  const selectedTransport = transports.find(t => t.id === selectedTransportId);
  const totalSelected = selectedAcquisitionIds.size + selectedOrderIds.size;

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content create-transport-record-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <Truck size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Create Transport Record
          </h2>
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="transport-record-form">
          {error && (
            <div className="error-message">
              {error}
              <button type="button" onClick={() => setError(null)}>×</button>
            </div>
          )}

          {isLoadingData ? (
            <div className="loading-container">
              <Loader2 size={32} className="animate-spin" />
              <p>Loading draft entities...</p>
            </div>
          ) : (
            <>
              {/* Entity Selection */}
              <div className="form-section">
                <h3>Select Entities</h3>
                {totalSelected > 0 && (
                  <div className="selection-summary">
                    <strong>{totalSelected}</strong> {totalSelected === 1 ? 'entity' : 'entities'} selected
                  </div>
                )}

                {/* Acquisitions Section */}
                {draftAcquisitions.length > 0 && (
                  <div className="entity-category">
                    <div className="entity-category-header">
                      <h4>
                        <FileText size={18} />
                        Acquisitions ({draftAcquisitions.length})
                      </h4>
                      <button
                        type="button"
                        className="select-all-btn"
                        onClick={handleSelectAllAcquisitions}
                      >
                        {selectedAcquisitionIds.size === draftAcquisitions.length ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>
                    <div className="entity-list">
                      {draftAcquisitions.map(acq => (
                        <div
                          key={acq.id}
                          className={`entity-item ${selectedAcquisitionIds.has(acq.id) ? 'selected' : ''}`}
                          onClick={() => handleAcquisitionToggle(acq.id)}
                        >
                          <input
                            type="checkbox"
                            checked={selectedAcquisitionIds.has(acq.id)}
                            onChange={() => handleAcquisitionToggle(acq.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="entity-checkbox"
                          />
                          <div className="entity-info">
                            <strong>#{acq.id} - {acq.title}</strong>
                            <span className="entity-details">
                              {acq.type === 0 ? 'Raw Materials' : 'Recyclable Materials'} • {acq.totalItems} item(s)
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
                        Orders ({draftOrders.length})
                      </h4>
                      <button
                        type="button"
                        className="select-all-btn"
                        onClick={handleSelectAllOrders}
                      >
                        {selectedOrderIds.size === draftOrders.length ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>
                    <div className="entity-list">
                      {draftOrders.map(order => (
                        <div
                          key={order.id}
                          className={`entity-item ${selectedOrderIds.has(order.id) ? 'selected' : ''}`}
                          onClick={() => handleOrderToggle(order.id)}
                        >
                          <input
                            type="checkbox"
                            checked={selectedOrderIds.has(order.id)}
                            onChange={() => handleOrderToggle(order.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="entity-checkbox"
                          />
                          <div className="entity-info">
                            <strong>#{order.id} - {order.clientName}</strong>
                            <span className="entity-details">
                              {order.orderMaterials.length} item(s) • ${order.totalValue.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {draftAcquisitions.length === 0 && draftOrders.length === 0 && (
                  <div className="no-entities">No draft entities available</div>
                )}
              </div>

              {/* Transport Selection */}
              {totalSelected > 0 && (
                <div className="form-section">
                  <h3>Select Transport</h3>
                  <div className="form-group">
                    <label htmlFor="transportId">Transport Vehicle *</label>
                    <select
                      id="transportId"
                      value={selectedTransportId || ''}
                      onChange={(e) => setSelectedTransportId(Number(e.target.value) || null)}
                      required
                    >
                      <option value="">Select a transport...</option>
                      {transports.map(transport => (
                        <option key={transport.id} value={transport.id}>
                          {transport.carName} {transport.numberPlate ? `(${transport.numberPlate})` : ''} - {transport.phoneNumber}
                        </option>
                      ))}
                    </select>
                    {selectedTransport && (
                      <div className="transport-details">
                        <small>
                          <strong>Car:</strong> {selectedTransport.carName} | 
                          <strong> Plate:</strong> {selectedTransport.numberPlate || 'N/A'} | 
                          <strong> Phone:</strong> {selectedTransport.phoneNumber}
                        </small>
                      </div>
                    )}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="transportDate">Transport Date</label>
                      <input
                        type="date"
                        id="transportDate"
                        value={transportDate}
                        onChange={(e) => setTransportDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="transportNotes">Transport Notes</label>
                      <textarea
                        id="transportNotes"
                        value={transportNotes}
                        onChange={(e) => setTransportNotes(e.target.value)}
                        placeholder="Optional notes about the transport..."
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={onClose}
              disabled={isLoading || isLoadingData}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={isLoading || isLoadingData || totalSelected === 0 || !selectedTransportId}
            >
              {isLoading ? `Assigning to ${totalSelected} ${totalSelected === 1 ? 'entity' : 'entities'}...` : `Assign Transport to ${totalSelected} ${totalSelected === 1 ? 'Entity' : 'Entities'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTransportRecord;

