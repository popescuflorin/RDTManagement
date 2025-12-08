import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Acquisition } from '../../types';
import { AcquisitionType, AcquisitionStatus } from '../../types';
import { FileText, Truck, Building2, Package, UserCircle, History, Clock } from 'lucide-react';
import { Modal, ViewContent, ViewSection, ViewGrid, ViewItem, ViewLabel, ViewValue } from '../atoms';

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
  const { t } = useTranslation(['acquisitions', 'common']);

  if (!isOpen) return null;

  const getTypeLabel = (type: AcquisitionType) => {
    return type === AcquisitionType.RawMaterials ? t('type.rawMaterials') : t('type.recyclableMaterials');
  };

  const getStatusLabel = (status: AcquisitionStatus) => {
    const statusConfig = {
      [AcquisitionStatus.Draft]: t('status.draft'),
      [AcquisitionStatus.Received]: t('status.received'),
      [AcquisitionStatus.Cancelled]: t('status.cancelled'),
      [AcquisitionStatus.ReadyForProcessing]: t('status.readyForProcessing')
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('view.title')}
      titleIcon={FileText}
      maxWidth="900px"
      showCancel={false}
      closeOnBackdropClick={false}
    >
      <ViewContent>
        {/* Acquisition Details */}
        <ViewSection title={t('view.sections.acquisitionDetails')} titleIcon={FileText}>
          <ViewGrid>
            <ViewItem>
              <ViewLabel>{t('view.labels.title')}</ViewLabel>
              <ViewValue>{acquisition.title}</ViewValue>
            </ViewItem>
            <ViewItem>
              <ViewLabel>{t('view.labels.status')}</ViewLabel>
              <ViewValue>
                <span className={`status-badge ${getStatusClass(acquisition.status)}`}>
                  {getStatusLabel(acquisition.status)}
                </span>
              </ViewValue>
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
            {acquisition.receivedByUserName && (
              <ViewItem>
                <ViewLabel>{t('view.labels.receivedBy')}</ViewLabel>
                <ViewValue>{acquisition.receivedByUserName} {t('view.labels.on')} {acquisition.receivedAt ? new Date(acquisition.receivedAt).toLocaleDateString() : '-'}</ViewValue>
              </ViewItem>
            )}
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

          {/* Transport & Supplier Details */}
          {(acquisition.transportCarName || acquisition.supplierName) && (
            <div className="form-section">
              <div className="details-grid">
                {/* Transport Details */}
                {acquisition.transportCarName && (
                  <div className="details-column">
                    <h4><Truck size={18} /> {t('view.sections.transport')}</h4>
                    <div className="acquisition-summary">
                      <div className="summary-row">
                        <span className="summary-label">{t('view.labels.vehicle')}:</span>
                        <span className="summary-value">{acquisition.transportCarName}</span>
                      </div>
                      <div className="summary-row">
                        <span className="summary-label">{t('view.labels.numberPlate')}:</span>
                        <span className="summary-value">{acquisition.transportNumberPlate || t('view.labels.notSet')}</span>
                      </div>
                      {acquisition.transportPhoneNumber && (
                        <div className="summary-row">
                          <span className="summary-label">{t('view.labels.phone')}:</span>
                          <span className="summary-value">{acquisition.transportPhoneNumber}</span>
                        </div>
                      )}
                      {acquisition.transportDate && (
                        <div className="summary-row">
                          <span className="summary-label">{t('view.labels.date')}:</span>
                          <span className="summary-value">{new Date(acquisition.transportDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      {acquisition.transportNotes && (
                        <div className="summary-row">
                          <span className="summary-label">{t('view.labels.transportNotes')}:</span>
                          <span className="summary-value">{acquisition.transportNotes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Supplier Details */}
                {acquisition.supplierName && (
                  <div className="details-column">
                    <h4><Building2 size={18} /> {t('view.sections.supplier')}</h4>
                    <div className="acquisition-summary">
                      <div className="summary-row">
                        <span className="summary-label">{t('view.labels.name')}:</span>
                        <span className="summary-value">{acquisition.supplierName}</span>
                      </div>
                      {acquisition.supplierContact && (
                        <div className="summary-row">
                          <span className="summary-label">{t('view.labels.contact')}:</span>
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
                ? t('view.sections.recyclableMaterialsInitial')
                : t('view.sections.materials')}
            </h3>
            <div className="received-items">
              {acquisition.items.map((item) => (
                <div key={item.id} className="item-card">
                  <div className="item-info">
                    <div className="item-name">{item.rawMaterialName}</div>
                    <div className="item-color">{t('form.itemCard.color')}: {item.rawMaterialColor}</div>
                  </div>
                  <div className="item-details">
                    <div className="form-row">
                      <div className="form-group">
                        <label>{t('view.labels.orderedQuantity')}</label>
                        <input
                          type="number"
                          value={item.orderedQuantity}
                          disabled
                          className="disabled-field"
                        />
                      </div>
                      {item.receivedQuantity !== null && item.receivedQuantity !== undefined && (
                        <div className="form-group">
                          <label>{t('view.labels.receivedQuantity')}</label>
                          <input
                            type="number"
                            value={item.receivedQuantity}
                            disabled
                            className="disabled-field"
                          />
                        </div>
                      )}
                      <div className="form-group">
                        <label>{t('view.labels.unitOfMeasure')}</label>
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
                        <label>{t('view.labels.notes')}</label>
                        <textarea
                          value={item.notes}
                          disabled
                          className="disabled-field"
                          rows={2}
                        />
                      </div>
                    )}
                    <div className="item-summary">
                      {item.receivedQuantity !== null && item.receivedQuantity !== undefined ? (
                        <>
                          <div className="item-total">
                            {t('view.labels.ordered')}: {item.orderedQuantity} {item.quantityType} | {t('view.labels.received')}: {item.receivedQuantity} {item.quantityType}
                          </div>
                          {item.receivedQuantity === item.orderedQuantity && (
                            <div className="quantity-status complete" style={{marginTop: '8px'}}>{t('view.labels.completeDelivery')}</div>
                          )}
                          {item.receivedQuantity < item.orderedQuantity && (
                            <div className="quantity-status partial" style={{marginTop: '8px'}}>{t('view.labels.partialDelivery')} ({((item.receivedQuantity / item.orderedQuantity) * 100).toFixed(0)}%)</div>
                          )}
                          {item.receivedQuantity > item.orderedQuantity && (
                            <div className="quantity-status excess" style={{marginTop: '8px'}}>{t('view.labels.excessReceived')} (+{(item.receivedQuantity - item.orderedQuantity).toFixed(2)} {item.quantityType})</div>
                          )}
                        </>
                      ) : (
                        <div className="item-total">
                          {t('view.labels.ordered')}: {item.orderedQuantity} {item.quantityType}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="reception-summary">
              <div className="summary-item">
                <strong>{t('view.labels.totalItems')}:</strong> {acquisition.totalItems}
              </div>
              <div className="summary-item">
                <strong>{t('view.labels.totalQuantity')}:</strong> {acquisition.totalQuantity} {t('view.labels.units')}
              </div>
              {acquisition.totalActualCost > 0 && (
                <div className="summary-item">
                  <strong>{t('view.labels.totalCost')}:</strong> ${acquisition.totalActualCost.toFixed(2)}
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
              <h3><Package size={20} /> {t('view.sections.processedRawMaterials')}</h3>
              <div className="info-message">
                {t('view.messages.processedMaterialsInfo')}
              </div>
              <div className="received-items">
                {acquisition.processedMaterials.map((pm) => (
                  <div key={pm.id} className="item-card">
                    <div className="item-info">
                      <div className="item-name">{pm.rawMaterialName}</div>
                      <div className="item-color">{t('form.itemCard.color')}: {pm.rawMaterialColor}</div>
                    </div>
                    <div className="item-details">
                      <div className="form-row">
                        <div className="form-group">
                          <label>{t('view.labels.quantity')}</label>
                          <input
                            type="number"
                            value={pm.quantity}
                            disabled
                            className="disabled-field"
                          />
                        </div>
                        <div className="form-group">
                          <label>{t('view.labels.unitOfMeasure')}</label>
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
                          {t('view.labels.total')}: {pm.quantity} {pm.rawMaterialQuantityType}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Processed Materials Summary */}
              <div className="reception-summary">
                <div className="summary-item">
                  <strong>{t('view.labels.totalProcessedItems')}:</strong> {acquisition.processedMaterials.length}
                </div>
                <div className="summary-item">
                  <strong>{t('view.labels.totalOutputQuantity')}:</strong> {acquisition.processedMaterials.reduce((sum, pm) => sum + pm.quantity, 0).toFixed(2)} {t('view.labels.units')}
                </div>
              </div>
            </div>
          )}

          {/* History Timeline */}
          {acquisition.history && acquisition.history.length > 0 && (
            <div className="form-section">
              <h3><History size={20} /> {t('view.sections.changeHistory')}</h3>
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
                          <strong>{t('view.labels.changes')}:</strong> {historyItem.changes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

      </ViewContent>
    </Modal>
  );
};

export default ViewAcquisition;

