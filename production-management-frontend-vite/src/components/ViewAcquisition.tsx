import React from 'react';
import type { Acquisition } from '../types';
import { AcquisitionType, AcquisitionStatus } from '../types';
import { X, FileText, Truck, Building2, Package, UserCircle, History, Clock } from 'lucide-react';
import './CreateAcquisition.css';

interface ViewAcquisitionProps {
  isOpen: boolean;
  onClose: () => void;
  acquisition: Acquisition;
}

const ViewAcquisition: React.FC<ViewAcquisitionProps> = ({
  isOpen,
  onClose,
  acquisition
}) => {
  const handleBackdropClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  if (!isOpen) return null;

  const getTypeLabel = (type: AcquisitionType) => {
    return type === AcquisitionType.RawMaterials ? 'Raw Materials' : 'Recyclable Materials';
  };

  const getStatusLabel = (status: AcquisitionStatus) => {
    const statusConfig = {
      [AcquisitionStatus.Draft]: 'Draft',
      [AcquisitionStatus.Received]: 'Received',
      [AcquisitionStatus.Cancelled]: 'Cancelled',
      [AcquisitionStatus.ReadyForProcessing]: 'Ready for Processing'
    };
    return statusConfig[status];
  };

  const getStatusClass = (status: AcquisitionStatus) => {
    const statusConfig = {
      [AcquisitionStatus.Draft]: 'status-draft',
      [AcquisitionStatus.Received]: 'status-received',
      [AcquisitionStatus.Cancelled]: 'status-cancelled',
      [AcquisitionStatus.ReadyForProcessing]: 'status-processing'
    };
    return statusConfig[status];
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content create-acquisition-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>View Acquisition</h2>
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="acquisition-form">
          {/* Acquisition Details */}
          <div className="form-section">
            <h3><FileText size={20} /> Acquisition Details</h3>
            <div className="acquisition-summary">
              <div className="summary-row">
                <span className="summary-label">Title:</span>
                <span className="summary-value">{acquisition.title}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Status:</span>
                <span className="summary-value">
                  <span className={`status-badge ${getStatusClass(acquisition.status)}`}>
                    {getStatusLabel(acquisition.status)}
                  </span>
                </span>
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
              {acquisition.receivedByUserName && (
                <div className="summary-row">
                  <span className="summary-label">Received By:</span>
                  <span className="summary-value">{acquisition.receivedByUserName} on {acquisition.receivedAt ? new Date(acquisition.receivedAt).toLocaleDateString() : '-'}</span>
                </div>
              )}
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

          {/* Transport & Supplier Details */}
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

          {/* Materials */}
          <div className="form-section">
            <h3><Package size={20} /> 
              {acquisition.type === AcquisitionType.RecyclableMaterials && acquisition.status === AcquisitionStatus.Received 
                ? 'Recyclable Materials (Initial State)' 
                : 'Materials'}
            </h3>
            <div className="received-items">
              {acquisition.items.map((item) => (
                <div key={item.id} className="item-card">
                  <div className="item-info">
                    <div className="item-name">{item.rawMaterialName}</div>
                    <div className="item-color">Color: {item.rawMaterialColor}</div>
                  </div>
                  <div className="item-details">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Quantity</label>
                        <input
                          type="number"
                          value={item.quantity}
                          disabled
                          className="disabled-field"
                        />
                      </div>
                      <div className="form-group">
                        <label>Unit of Measure</label>
                        <input
                          type="text"
                          value={item.quantityType}
                          disabled
                          className="disabled-field"
                        />
                      </div>
                    </div>
                    {item.notes && (
                      <div className="form-group">
                        <label>Notes</label>
                        <textarea
                          value={item.notes}
                          disabled
                          className="disabled-field"
                          rows={2}
                        />
                      </div>
                    )}
                    <div className="item-summary">
                      <div className="item-total">
                        Total: {item.quantity} {item.quantityType}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="reception-summary">
              <div className="summary-item">
                <strong>Total Items:</strong> {acquisition.totalItems}
              </div>
              <div className="summary-item">
                <strong>Total Quantity:</strong> {acquisition.totalQuantity} units
              </div>
              {acquisition.totalActualCost > 0 && (
                <div className="summary-item">
                  <strong>Total Cost:</strong> ${acquisition.totalActualCost.toFixed(2)}
                </div>
              )}
            </div>
          </div>

          {/* Processed Raw Materials (for processed recyclables) */}
          {acquisition.type === AcquisitionType.RecyclableMaterials && 
           acquisition.status === AcquisitionStatus.Received && 
           acquisition.processedMaterials && 
           acquisition.processedMaterials.length > 0 && (
            <div className="form-section">
              <h3><Package size={20} /> Processed Raw Materials (Output)</h3>
              <div className="info-message">
                These raw materials were produced from the recyclable materials above through the processing stage.
              </div>
              <div className="received-items">
                {acquisition.processedMaterials.map((pm) => (
                  <div key={pm.id} className="item-card">
                    <div className="item-info">
                      <div className="item-name">{pm.rawMaterialName}</div>
                      <div className="item-color">Color: {pm.rawMaterialColor}</div>
                    </div>
                    <div className="item-details">
                      <div className="form-row">
                        <div className="form-group">
                          <label>Quantity</label>
                          <input
                            type="number"
                            value={pm.quantity}
                            disabled
                            className="disabled-field"
                          />
                        </div>
                        <div className="form-group">
                          <label>Unit of Measure</label>
                          <input
                            type="text"
                            value={pm.rawMaterialQuantityType}
                            disabled
                            className="disabled-field"
                          />
                        </div>
                      </div>
                      <div className="item-summary">
                        <div className="item-total">
                          Total: {pm.quantity} {pm.rawMaterialQuantityType}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Processed Materials Summary */}
              <div className="reception-summary">
                <div className="summary-item">
                  <strong>Total Processed Items:</strong> {acquisition.processedMaterials.length}
                </div>
                <div className="summary-item">
                  <strong>Total Output Quantity:</strong> {acquisition.processedMaterials.reduce((sum, pm) => sum + pm.quantity, 0).toFixed(2)} units
                </div>
              </div>
            </div>
          )}

          {/* History Timeline */}
          {acquisition.history && acquisition.history.length > 0 && (
            <div className="form-section">
              <h3><History size={20} /> Change History</h3>
              <div className="history-timeline">
                {acquisition.history.map((historyItem) => (
                  <div key={historyItem.id} className="history-item">
                    <div className="history-icon">
                      <Clock size={16} />
                    </div>
                    <div className="history-content">
                      <div className="history-header">
                        <span className="history-action">{historyItem.action}</span>
                        <span className="history-timestamp">
                          {new Date(historyItem.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="history-user">
                        <UserCircle size={14} style={{display: 'inline', marginRight: '4px'}} />
                        {historyItem.userName}
                      </div>
                      {historyItem.notes && (
                        <div className="history-notes">{historyItem.notes}</div>
                      )}
                      {historyItem.changes && (
                        <div className="history-changes">
                          <strong>Changes:</strong> {historyItem.changes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Close Button */}
          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewAcquisition;

