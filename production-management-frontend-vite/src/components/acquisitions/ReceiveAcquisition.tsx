import React, { useState, useEffect } from 'react';
import { acquisitionApi } from '../../services/api';
import type { Acquisition, ReceiveAcquisitionRequest } from '../../types';
import { AcquisitionType } from '../../types';
import { X, Package, FileText, Truck, Building2, UserCircle } from 'lucide-react';
import './CreateAcquisition.css';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that all received quantities are valid
    const hasInvalidQuantity = items.some(item => item.receivedQuantity < 0);
    if (hasInvalidQuantity) {
      setError('Received quantities cannot be negative');
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
      setError(err.response?.data?.message || 'Failed to receive acquisition');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  if (!isOpen) return null;

  const getTypeLabel = (type: AcquisitionType) => {
    return type === AcquisitionType.RawMaterials ? 'Raw Materials' : 'Recyclable Materials';
  };

  const getModalTitle = () => {
    if (acquisition.type === AcquisitionType.RawMaterials) {
      return 'Receive Raw Materials';
    }
    return 'Receive & Clean Recyclable Materials';
  };

  const getSubmitButtonLabel = () => {
    if (acquisition.type === AcquisitionType.RawMaterials) {
      return 'Receive & Add to Inventory';
    }
    return 'Mark Ready for Processing';
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content create-acquisition-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{getModalTitle()}</h2>
          <button className="close-button" onClick={handleClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="acquisition-form">
          {/* Error Message */}
          {error && (
            <div className="error-message">
              {error}
              <button type="button" onClick={() => setError(null)}>×</button>
            </div>
          )}

          {/* Info Message for Recyclable Materials */}
          {acquisition.type === AcquisitionType.RecyclableMaterials && (
            <div className="info-message">
              <strong>Note:</strong> Recyclable materials will be marked as "Ready for Processing" after this step. 
              They will NOT be added to inventory until after the processing/cleaning stage is complete.
            </div>
          )}

          {/* Acquisition Details - Compact Summary */}
          <div className="form-section">
            <h3><FileText size={20} /> Acquisition Details</h3>
            <div className="acquisition-summary">
              <div className="summary-row">
                <span className="summary-label">Title:</span>
                <span className="summary-value">{acquisition.title}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Type:</span>
                <span className="summary-value">{getTypeLabel(acquisition.type)}</span>
              </div>
              {acquisition.description && (
                <div className="summary-row">
                  <span className="summary-label">Description:</span>
                  <span className="summary-value">{acquisition.description}</span>
                </div>
              )}
              <div className="summary-row">
                <span className="summary-label"><UserCircle size={14} style={{display: 'inline', marginRight: '4px'}} />Assigned To:</span>
                <span className="summary-value">{acquisition.assignedToUserName || 'Unassigned'}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Created By:</span>
                <span className="summary-value">{acquisition.createdByUserName} on {new Date(acquisition.createdAt).toLocaleDateString()}</span>
              </div>
              {acquisition.dueDate && (
                <div className="summary-row">
                  <span className="summary-label">Due Date:</span>
                  <span className="summary-value">{new Date(acquisition.dueDate).toLocaleDateString()}</span>
                </div>
              )}
              {acquisition.notes && (
                <div className="summary-row">
                  <span className="summary-label">Notes:</span>
                  <span className="summary-value">{acquisition.notes}</span>
                </div>
              )}
            </div>
          </div>

          {/* Transport & Supplier Details - Compact */}
          {(acquisition.transportCarName || acquisition.supplierName) && (
            <div className="form-section">
              <div className="details-grid">
                {/* Transport Details */}
                {acquisition.transportCarName && (
                  <div className="details-column">
                    <h4><Truck size={18} /> Transport</h4>
                    <div className="acquisition-summary">
                      <div className="summary-row">
                        <span className="summary-label">Vehicle:</span>
                        <span className="summary-value">{acquisition.transportCarName}</span>
                      </div>
                      {acquisition.transportNumberPlate && (
                        <div className="summary-row">
                          <span className="summary-label">Number Plate:</span>
                          <span className="summary-value">{acquisition.transportNumberPlate}</span>
                        </div>
                      )}
                      {acquisition.transportPhoneNumber && (
                        <div className="summary-row">
                          <span className="summary-label">Phone:</span>
                          <span className="summary-value">{acquisition.transportPhoneNumber}</span>
                        </div>
                      )}
                      {acquisition.transportDate && (
                        <div className="summary-row">
                          <span className="summary-label">Date:</span>
                          <span className="summary-value">{new Date(acquisition.transportDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      {acquisition.transportNotes && (
                        <div className="summary-row">
                          <span className="summary-label">Notes:</span>
                          <span className="summary-value">{acquisition.transportNotes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Supplier Details */}
                {acquisition.supplierName && (
                  <div className="details-column">
                    <h4><Building2 size={18} /> Supplier</h4>
                    <div className="acquisition-summary">
                      <div className="summary-row">
                        <span className="summary-label">Name:</span>
                        <span className="summary-value">{acquisition.supplierName}</span>
                      </div>
                      {acquisition.supplierContact && (
                        <div className="summary-row">
                          <span className="summary-label">Contact:</span>
                          <span className="summary-value">{acquisition.supplierContact}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Materials - With Received Quantity */}
          <div className="form-section">
            <h3><Package size={20} /> Materials to Receive</h3>
            <div className="received-items">
              {items.map((item, index) => (
                <div key={item.id} className="item-card">
                  <div className="item-info">
                    <div className="item-name">{item.name}</div>
                    <div className="item-color">Color: {item.color}</div>
                  </div>
                  <div className="item-details">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Ordered Quantity</label>
                        <input
                          type="number"
                          value={item.orderedQuantity}
                          disabled
                          className="disabled-field"
                        />
                      </div>
                      <div className="form-group">
                        <label>Received Quantity *</label>
                        <input
                          type="number"
                          value={item.receivedQuantity}
                          onChange={(e) => handleUpdateReceivedQuantity(index, parseFloat(e.target.value) || 0)}
                          onWheel={handleWheel}
                          min="0"
                          step="0.01"
                          placeholder="Enter received quantity"
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Unit of Measure</label>
                        <input
                          type="text"
                          value={item.unitOfMeasure}
                          disabled
                          className="disabled-field"
                        />
                      </div>
                    </div>
                    <div className="item-summary">
                      <div className={`quantity-status ${item.receivedQuantity === item.orderedQuantity ? 'complete' : item.receivedQuantity > item.orderedQuantity ? 'excess' : 'partial'}`}>
                        {item.receivedQuantity === item.orderedQuantity && '✓ Complete'}
                        {item.receivedQuantity > item.orderedQuantity && '⚠ Excess received'}
                        {item.receivedQuantity < item.orderedQuantity && '⚠ Partial delivery'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Reception Summary */}
            <div className="reception-summary">
              <div className="summary-item">
                <strong>Total Items:</strong> {items.length}
              </div>
              <div className="summary-item">
                <strong>Total Ordered:</strong> {items.reduce((sum, item) => sum + item.orderedQuantity, 0).toFixed(2)} units
              </div>
              <div className="summary-item">
                <strong>Total Receiving:</strong> {items.reduce((sum, item) => sum + item.receivedQuantity, 0).toFixed(2)} units
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : getSubmitButtonLabel()}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReceiveAcquisition;

