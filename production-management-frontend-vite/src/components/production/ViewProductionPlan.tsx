import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Factory, 
  Package, 
  Clock, 
  Calendar, 
  FileText, 
  CheckCircle, 
  AlertTriangle,
  Eye,
  X
} from 'lucide-react';
import type { ProductionPlan } from '../../types';
import { ProductionPlanStatus } from '../../types';
import './ViewProductionPlan.css';

interface ViewProductionPlanProps {
  plan: ProductionPlan;
  onClose: () => void;
}

const ViewProductionPlan: React.FC<ViewProductionPlanProps> = ({ plan, onClose }) => {
  const { t } = useTranslation(['production', 'common']);
  const getStatusInfo = (status: ProductionPlanStatus) => {
    switch (status) {
      case ProductionPlanStatus.Draft:
        return { label: t('status.draft'), color: 'status-draft', icon: FileText };
      case ProductionPlanStatus.Planned:
        return { label: t('status.planned'), color: 'status-planned', icon: Calendar };
      case ProductionPlanStatus.InProgress:
        return { label: t('status.inProgress'), color: 'status-in-progress', icon: Clock };
      case ProductionPlanStatus.Completed:
        return { label: t('status.completed'), color: 'status-completed', icon: CheckCircle };
      case ProductionPlanStatus.Cancelled:
        return { label: t('status.cancelled'), color: 'status-cancelled', icon: X };
      default:
        return { label: t('status.unknown'), color: 'status-draft', icon: FileText };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };


  const statusInfo = getStatusInfo(plan.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="view-production-plan-overlay" onClick={onClose}>
      <div className="view-production-plan-modal" onClick={(e) => e.stopPropagation()}>
        <div className="view-production-plan-header">
          <div className="header-content">
            <div className="header-title">
              <Eye className="header-icon" />
              <h2>{t('viewPlan.title')}</h2>
            </div>
            <button className="close-button" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
          <div className="header-status">
            <div className={`status-badge ${statusInfo.color}`}>
              <StatusIcon size={16} />
              <span>{statusInfo.label}</span>
            </div>
          </div>
        </div>

        <div className="view-production-plan-content">
          {/* Plan Overview Section */}
          <div className="info-section">
            <div className="section-header">
              <Package className="section-icon" />
              <h3>{t('viewPlan.sections.planOverview')}</h3>
            </div>
            
            <div className="info-grid">
              <div className="info-item">
                <label>{t('viewPlan.fields.planName')}</label>
                <div className="info-value">{plan.name}</div>
              </div>
              
              {plan.description && (
                <div className="info-item full-width">
                  <label>{t('viewPlan.fields.description')}</label>
                  <div className="info-value">{plan.description}</div>
                </div>
              )}
              
              <div className="info-item">
                <label>{t('viewPlan.fields.targetProduct')}</label>
                <div className="info-value">
                  <div className="product-info">
                    <span className="product-name">{plan.targetProductName}</span>
                    <span className="product-color">({plan.targetProductColor})</span>
                  </div>
                </div>
              </div>
              
              <div className="info-item">
                <label>{t('viewPlan.fields.quantityToProduce')}</label>
                <div className="info-value">{plan.quantityToProduce} {t('viewPlan.fields.units')}</div>
              </div>
            </div>
          </div>

          {/* Timing Information */}
          <div className="info-section">
            <div className="section-header">
              <Clock className="section-icon" />
              <h3>{t('viewPlan.sections.timingInformation')}</h3>
            </div>
            
            <div className="info-grid">
              <div className="info-item">
                <label>{t('viewPlan.fields.estimatedProductionTime')}</label>
                <div className="info-value">{t('viewPlan.labels.na')}</div>
              </div>
              
              {plan.plannedStartDate && (
                <div className="info-item">
                  <label>{t('viewPlan.fields.plannedStartDate')}</label>
                  <div className="info-value">{formatDate(plan.plannedStartDate)}</div>
                </div>
              )}
              
              <div className="info-item">
                <label>{t('viewPlan.fields.created')}</label>
                <div className="info-value">{formatDateTime(plan.createdAt)}</div>
              </div>
              
              {plan.startedAt && (
                <div className="info-item">
                  <label>{t('viewPlan.fields.startedAt')}</label>
                  <div className="info-value">{formatDateTime(plan.startedAt)}</div>
                </div>
              )}
            </div>
          </div>

          {/* Production Status */}
          {plan.status !== ProductionPlanStatus.Draft && (
            <div className="info-section">
              <div className="section-header">
                <Factory className="section-icon" />
                <h3>{t('viewPlan.sections.productionStatus')}</h3>
              </div>
              
              <div className="info-grid">
                <div className="info-item">
                  <label>{t('viewPlan.fields.materialsStatus')}</label>
                  <div className="info-value">
                    <div className={`availability-badge ${plan.requiredMaterials.every(m => m.isAvailable) ? 'available' : 'unavailable'}`}>
                      {plan.requiredMaterials.every(m => m.isAvailable) ? (
                        <>
                          <CheckCircle size={16} />
                          <span>{t('viewPlan.status.allMaterialsAvailable')}</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle size={16} />
                          <span>{t('viewPlan.status.missingMaterials')}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                {plan.startedAt && (
                  <div className="info-item">
                    <label>{t('viewPlan.fields.actualStartDate')}</label>
                    <div className="info-value">{formatDateTime(plan.startedAt)}</div>
                  </div>
                )}
                
                {plan.completedAt && (
                  <div className="info-item">
                    <label>{t('viewPlan.fields.actualEndDate')}</label>
                    <div className="info-value">{formatDateTime(plan.completedAt)}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Required Materials */}
          <div className="info-section">
            <div className="section-header">
              <Package className="section-icon" />
              <h3>{t('viewPlan.sections.requiredMaterials')}</h3>
            </div>
            
            <div className="materials-container">
              <table className="materials-table">
                <thead>
                  <tr>
                    <th>{t('viewPlan.table.material')}</th>
                    <th>{t('viewPlan.table.requiredPerUnit')}</th>
                    <th>{t('viewPlan.table.totalNeed')}</th>
                    <th>{t('viewPlan.table.available')}</th>
                    <th>{t('viewPlan.table.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.requiredMaterials.map((material, index) => {
                    const totalNeeded = material.requiredQuantity * plan.quantityToProduce;
                    const isAvailable = material.availableQuantity >= totalNeeded;
                    const shortage = totalNeeded - material.availableQuantity;
                    
                    return (
                      <tr key={index} className={!isAvailable ? 'insufficient-stock' : ''}>
                        <td>
                          <div className="material-info">
                            <span className="material-name">{material.materialName}</span>
                            <span className="material-color">({material.materialColor})</span>
                          </div>
                        </td>
                        <td>{material.requiredQuantity} {material.quantityType}</td>
                        <td>{totalNeeded.toFixed(2)} {material.quantityType}</td>
                        <td>{material.availableQuantity.toFixed(2)} {material.quantityType}</td>
                        <td>
                          <div className={`availability-badge ${isAvailable ? 'available' : 'unavailable'}`}>
                            {isAvailable ? (
                              <>
                                <CheckCircle size={14} />
                                <span>{t('viewPlan.status.available')}</span>
                              </>
                            ) : (
                              <>
                                <AlertTriangle size={14} />
                                <span>{t('viewPlan.status.short', { amount: shortage.toFixed(2) })}</span>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          {plan.notes && (
            <div className="info-section">
              <div className="section-header">
                <FileText className="section-icon" />
                <h3>{t('viewPlan.sections.notes')}</h3>
              </div>
              <div className="notes-content">
                {plan.notes}
              </div>
            </div>
          )}
        </div>

        <div className="view-production-plan-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            {t('viewPlan.buttons.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewProductionPlan;
