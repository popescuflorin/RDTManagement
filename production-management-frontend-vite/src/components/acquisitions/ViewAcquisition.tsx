import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Acquisition } from '../../types';
import { AcquisitionType, AcquisitionStatus } from '../../types';
import { FileText, Truck, Building2, Package, UserCircle, History, Clock } from 'lucide-react';
import { Modal, ViewContent, ViewSection, ViewGrid, ViewItem, ViewLabel, ViewValue, FormGroup, Label, Input, Textarea } from '../atoms';

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

        {/* Materials */}
        <ViewSection 
          title={acquisition.type === AcquisitionType.RecyclableMaterials && acquisition.status === AcquisitionStatus.Received 
            ? t('view.sections.recyclableMaterialsInitial')
            : t('view.sections.materials')} 
          titleIcon={Package}
        >
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 'var(--space-md)' 
          }}>
            {acquisition.items.map((item) => (
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
                      {item.rawMaterialName}
                    </div>
                    <div style={{ 
                      fontSize: 'var(--text-sm)', 
                      color: 'var(--text-secondary)' 
                    }}>
                      {t('form.itemCard.color')}: {item.rawMaterialColor}
                    </div>
                  </div>
                  <div style={{ flex: 2 }}>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                      gap: 'var(--space-md)',
                      marginBottom: 'var(--space-md)'
                    }}>
                      <FormGroup>
                        <Label>{t('view.labels.orderedQuantity')}</Label>
                        <Input
                          type="number"
                          value={item.orderedQuantity}
                          disabled
                          className="disabled-field"
                        />
                      </FormGroup>
                      {item.receivedQuantity !== null && item.receivedQuantity !== undefined && (
                        <FormGroup>
                          <Label>{t('view.labels.receivedQuantity')}</Label>
                          <Input
                            type="number"
                            value={item.receivedQuantity}
                            disabled
                            className="disabled-field"
                          />
                        </FormGroup>
                      )}
                      <FormGroup>
                        <Label>{t('view.labels.unitOfMeasure')}</Label>
                        <Input
                          type="text"
                          value={item.quantityType}
                          disabled
                          className="disabled-field"
                        />
                      </FormGroup>
                    </div>
                    {item.notes && (
                      <FormGroup>
                        <Label>{t('view.labels.notes')}</Label>
                        <Textarea
                          value={item.notes}
                          disabled
                          className="disabled-field"
                          rows={2}
                        />
                      </FormGroup>
                    )}
                    <div style={{ 
                      marginTop: 'var(--space-md)', 
                      padding: 'var(--space-sm)', 
                      backgroundColor: 'var(--background-secondary)', 
                      borderRadius: 'var(--radius-sm)'
                    }}>
                      {item.receivedQuantity !== null && item.receivedQuantity !== undefined ? (
                        <>
                          <div style={{ fontWeight: 600, marginBottom: 'var(--space-xs)' }}>
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
                        <div style={{ fontWeight: 600 }}>
                          {t('view.labels.ordered')}: {item.orderedQuantity} {item.quantityType}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
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
              <strong>{t('view.labels.totalItems')}:</strong> {acquisition.totalItems}
            </div>
            <div>
              <strong>{t('view.labels.totalQuantity')}:</strong> {acquisition.totalQuantity} {t('view.labels.units')}
            </div>
            {acquisition.totalActualCost > 0 && (
              <div>
                <strong>{t('view.labels.totalCost')}:</strong> ${acquisition.totalActualCost.toFixed(2)}
              </div>
            )}
          </div>
        </ViewSection>

        {/* Processed Raw Materials (for processed recyclables) */}
        {acquisition.type === AcquisitionType.RecyclableMaterials && 
         acquisition.status === AcquisitionStatus.Received && 
         acquisition.processedMaterials && 
         acquisition.processedMaterials.length > 0 && (
          <ViewSection title={t('view.sections.processedRawMaterials')} titleIcon={Package}>
            <div style={{ 
              padding: 'var(--space-md)', 
              backgroundColor: 'var(--info-50)', 
              border: '1px solid var(--info-200)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-lg)',
              color: 'var(--info-700)'
            }}>
              {t('view.messages.processedMaterialsInfo')}
            </div>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 'var(--space-md)' 
            }}>
              {acquisition.processedMaterials.map((pm) => (
                <div key={pm.id} style={{ 
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
                        {pm.rawMaterialName}
                      </div>
                      <div style={{ 
                        fontSize: 'var(--text-sm)', 
                        color: 'var(--text-secondary)' 
                      }}>
                        {t('form.itemCard.color')}: {pm.rawMaterialColor}
                      </div>
                    </div>
                    <div style={{ flex: 2 }}>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                        gap: 'var(--space-md)',
                        marginBottom: 'var(--space-md)'
                      }}>
                        <FormGroup>
                          <Label>{t('view.labels.quantity')}</Label>
                          <Input
                            type="number"
                            value={pm.quantity}
                            disabled
                            className="disabled-field"
                          />
                        </FormGroup>
                        <FormGroup>
                          <Label>{t('view.labels.unitOfMeasure')}</Label>
                          <Input
                            type="text"
                            value={pm.rawMaterialQuantityType}
                            disabled
                            className="disabled-field"
                          />
                        </FormGroup>
                      </div>
                      <div style={{ 
                        marginTop: 'var(--space-md)', 
                        padding: 'var(--space-sm)', 
                        backgroundColor: 'var(--background-secondary)', 
                        borderRadius: 'var(--radius-sm)',
                        fontWeight: 600
                      }}>
                        {t('view.labels.total')}: {pm.quantity} {pm.rawMaterialQuantityType}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Processed Materials Summary */}
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
                <strong>{t('view.labels.totalProcessedItems')}:</strong> {acquisition.processedMaterials.length}
              </div>
              <div>
                <strong>{t('view.labels.totalOutputQuantity')}:</strong> {acquisition.processedMaterials.reduce((sum, pm) => sum + pm.quantity, 0).toFixed(2)} {t('view.labels.units')}
              </div>
            </div>
          </ViewSection>
        )}

        {/* History Timeline */}
        {acquisition.history && acquisition.history.length > 0 && (
          <ViewSection title={t('view.sections.changeHistory')} titleIcon={History}>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 'var(--space-lg)' 
            }}>
              {acquisition.history.map((historyItem) => (
                <div key={historyItem.id} style={{ 
                  display: 'flex',
                  gap: 'var(--space-md)',
                  padding: 'var(--space-md)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--surface)'
                }}>
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary-100)',
                    color: 'var(--primary-600)',
                    flexShrink: 0
                  }}>
                    <Clock size={16} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: 'var(--space-xs)'
                    }}>
                      <span style={{ 
                        fontWeight: 600,
                        fontSize: 'var(--text-base)',
                        color: 'var(--text-primary)'
                      }}>
                        {historyItem.action}
                      </span>
                      <span style={{ 
                        fontSize: 'var(--text-sm)',
                        color: 'var(--text-secondary)',
                        whiteSpace: 'nowrap'
                      }}>
                        {new Date(historyItem.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ 
                      fontSize: 'var(--text-sm)',
                      color: 'var(--text-secondary)',
                      marginBottom: 'var(--space-xs)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-xs)'
                    }}>
                      <UserCircle size={14} />
                      {historyItem.userName}
                    </div>
                    {historyItem.notes && (
                      <div style={{ 
                        fontSize: 'var(--text-sm)',
                        color: 'var(--text-primary)',
                        marginBottom: 'var(--space-xs)',
                        fontStyle: 'italic'
                      }}>
                        {historyItem.notes}
                      </div>
                    )}
                    {historyItem.changes && (
                      <div style={{ 
                        fontSize: 'var(--text-sm)',
                        color: 'var(--text-primary)',
                        padding: 'var(--space-sm)',
                        backgroundColor: 'var(--background-secondary)',
                        borderRadius: 'var(--radius-sm)',
                        marginTop: 'var(--space-sm)'
                      }}>
                        <strong>{t('view.labels.changes')}:</strong> {historyItem.changes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ViewSection>
        )}

      </ViewContent>
    </Modal>
  );
};

export default ViewAcquisition;

