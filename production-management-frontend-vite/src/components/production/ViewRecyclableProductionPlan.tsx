import React from 'react';
import { 
  Package,
  Clock,
  Calendar,
  FileText,
  CheckCircle,
  AlertTriangle,
  Eye,
  X
} from 'lucide-react';
import type { RecyclableProductionPlan } from '../../types';
import { ProductionPlanStatus } from '../../types';
import './ViewProductionPlan.css';

interface ViewRecyclableProductionPlanProps {
  plan: RecyclableProductionPlan;
  onClose: () => void;
}

const ViewRecyclableProductionPlan: React.FC<ViewRecyclableProductionPlanProps> = ({ plan, onClose }) => {
  const getStatusInfo = (status: ProductionPlanStatus) => {
    switch (status) {
      case ProductionPlanStatus.Draft:
        return { label: 'Draft', color: 'status-draft', icon: FileText };
      case ProductionPlanStatus.Planned:
        return { label: 'Planned', color: 'status-planned', icon: Calendar };
      case ProductionPlanStatus.InProgress:
        return { label: 'In Progress', color: 'status-in-progress', icon: Clock };
      case ProductionPlanStatus.Completed:
        return { label: 'Completed', color: 'status-completed', icon: CheckCircle };
      case ProductionPlanStatus.Cancelled:
        return { label: 'Cancelled', color: 'status-cancelled', icon: X };
      default:
        return { label: 'Unknown', color: 'status-draft', icon: FileText };
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
              <h2>Recyclable Plan Details</h2>
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
          {/* Plan Overview */}
          <div className="info-section">
            <div className="section-header">
              <Package className="section-icon" />
              <h3>Plan Overview</h3>
            </div>
            <div className="info-grid">
              <div className="info-item">
                <label>Plan Name</label>
                <div className="info-value">{plan.name}</div>
              </div>
              {plan.description && (
                <div className="info-item full-width">
                  <label>Description</label>
                  <div className="info-value">{plan.description}</div>
                </div>
              )}
              <div className="info-item">
                <label>Target Raw Material</label>
                <div className="info-value">
                  <div className="product-info">
                    <span className="product-name">{plan.targetRawMaterialName}</span>
                    <span className="product-color">({plan.targetRawMaterialColor})</span>
                  </div>
                </div>
              </div>
              <div className="info-item">
                <label>Quantity to Produce</label>
                <div className="info-value">{plan.quantityToProduce} {plan.targetRawMaterialQuantityType}</div>
              </div>
            </div>
          </div>

          {/* Timing */}
          <div className="info-section">
            <div className="section-header">
              <Clock className="section-icon" />
              <h3>Timing</h3>
            </div>
            <div className="info-grid">
              <div className="info-item">
                <label>Estimated Production Time</label>
                <div className="info-value">{plan.estimatedProductionTimeMinutes} min</div>
              </div>
              {plan.plannedStartDate && (
                <div className="info-item">
                  <label>Planned Start Date</label>
                  <div className="info-value">{formatDate(plan.plannedStartDate)}</div>
                </div>
              )}
              <div className="info-item">
                <label>Created</label>
                <div className="info-value">{formatDateTime(plan.createdAt)}</div>
              </div>
              {plan.startedAt && (
                <div className="info-item">
                  <label>Started At</label>
                  <div className="info-value">{formatDateTime(plan.startedAt)}</div>
                </div>
              )}
              {plan.completedAt && (
                <div className="info-item">
                  <label>Completed At</label>
                  <div className="info-value">{formatDateTime(plan.completedAt)}</div>
                </div>
              )}
            </div>
          </div>

          {/* Required Recyclables */}
          <div className="info-section">
            <div className="section-header">
              <Package className="section-icon" />
              <h3>Required Recyclables</h3>
            </div>
            <div className="materials-container">
              <table className="materials-table">
                <thead>
                  <tr>
                    <th>Material</th>
                    <th>Required (per unit)</th>
                    <th>Total Need</th>
                    <th>Available</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.requiredRecyclables.map((m, idx) => {
                    const totalNeeded = m.requiredQuantity * plan.quantityToProduce;
                    const isAvailable = m.availableQuantity >= totalNeeded;
                    const shortage = totalNeeded - m.availableQuantity;
                    return (
                      <tr key={idx} className={!isAvailable ? 'insufficient-stock' : ''}>
                        <td>
                          <div className="material-info">
                            <span className="material-name">{m.materialName}</span>
                            <span className="material-color">({m.materialColor})</span>
                          </div>
                        </td>
                        <td>{m.requiredQuantity} {m.quantityType}</td>
                        <td>{totalNeeded.toFixed(2)} {m.quantityType}</td>
                        <td>{m.availableQuantity.toFixed(2)} {m.quantityType}</td>
                        <td>
                          <div className={`availability-badge ${isAvailable ? 'available' : 'unavailable'}`}>
                            {isAvailable ? (
                              <>
                                <CheckCircle size={14} />
                                <span>Available</span>
                              </>
                            ) : (
                              <>
                                <AlertTriangle size={14} />
                                <span>Short {shortage.toFixed(2)}</span>
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
                <h3>Notes</h3>
              </div>
              <div className="notes-content">{plan.notes}</div>
            </div>
          )}
        </div>

        <div className="view-production-plan-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default ViewRecyclableProductionPlan;


