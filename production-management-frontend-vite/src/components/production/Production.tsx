import React, { useState, useEffect } from 'react';
import { 
  Factory, 
  Package, 
  CheckCircle, 
  Wrench, 
  BarChart3, 
  Plus, 
  Search, 
  Play,
  XCircle,
  Loader2,
  Edit,
  Eye,
  Truck
} from 'lucide-react';
import { productionPlanApi } from '../../services/api';
import type { ProductionPlan, ProductionPlanStatistics } from '../../types';
import { ProductionPlanStatus } from '../../types';
import CreateProductionPlan from './CreateProductionPlan';
import CancelProductionPlanModal from './CancelProductionPlanModal';
import EditProductionPlan from './EditProductionPlan';
import ViewProductionPlan from './ViewProductionPlan';
import ReceiveProduction from './ReceiveProduction';
import ProtectedButton from '../ProtectedButton';
import { Permissions } from '../../hooks/usePermissions';
import './Production.css';

const Production: React.FC = () => {
  const [plans, setPlans] = useState<ProductionPlan[]>([]);
  const [statistics, setStatistics] = useState<ProductionPlanStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<ProductionPlan | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ProductionPlan | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingPlan, setViewingPlan] = useState<ProductionPlan | null>(null);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [receivingPlan, setReceivingPlan] = useState<ProductionPlan | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'draft' | 'planned' | 'in-progress' | 'completed' | 'can-produce'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'status'>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [plansResponse, statisticsResponse] = await Promise.all([
        productionPlanApi.getAllPlans(),
        productionPlanApi.getStatistics()
      ]);
      setPlans(plansResponse.data);
      setStatistics(statisticsResponse.data);
    } catch (error: any) {
      console.error('Error loading production data:', error);
      setError('Failed to load production data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanCreated = (newPlan: ProductionPlan) => {
    setPlans(prevPlans => [...prevPlans, newPlan]);
    setShowCreateModal(false);
    loadData(); // Refresh statistics
  };

  const handleExecutePlan = async (planId: number) => {
    try {
      await productionPlanApi.startPlan(planId);
      loadData(); // Refresh all data after starting
    } catch (error: any) {
      console.error('Error starting plan:', error);
      setError(error.response?.data?.message || 'Failed to start production plan');
    }
  };

  const handleCancelPlan = (plan: ProductionPlan) => {
    setSelectedPlan(plan);
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedPlan) return;
    
    setIsCancelling(true);
    try {
      await productionPlanApi.cancelPlan(selectedPlan.id);
      loadData();
      setShowCancelModal(false);
      setSelectedPlan(null);
    } catch (error: any) {
      console.error('Error cancelling plan:', error);
      setError(error.response?.data?.message || 'Failed to cancel production plan');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCloseCancelModal = () => {
    setShowCancelModal(false);
    setSelectedPlan(null);
  };

  const handleEditPlan = (plan: ProductionPlan) => {
    setEditingPlan(plan);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingPlan(null);
  };

  const handlePlanUpdated = (updatedPlan: ProductionPlan) => {
    setPlans(prev => prev.map(plan => plan.id === updatedPlan.id ? updatedPlan : plan));
    setShowEditModal(false);
    setEditingPlan(null);
    loadData();
  };

  const handleViewPlan = (plan: ProductionPlan) => {
    setViewingPlan(plan);
    setShowViewModal(true);
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setViewingPlan(null);
  };

  const handleReceivePlan = (plan: ProductionPlan) => {
    setReceivingPlan(plan);
    setShowReceiveModal(true);
  };

  const handleCloseReceiveModal = () => {
    setShowReceiveModal(false);
    setReceivingPlan(null);
  };

  const handlePlanReceived = (updatedPlan: ProductionPlan) => {
    setPlans(prev => prev.map(plan => plan.id === updatedPlan.id ? updatedPlan : plan));
    setShowReceiveModal(false);
    setReceivingPlan(null);
    loadData();
  };


  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const filteredAndSortedPlans = plans
    .filter(plan => {
      // Search filter
      const searchMatch = searchTerm === '' || 
        plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.targetProductName.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      let statusMatch = true;
      if (filterBy === 'draft') {
        statusMatch = plan.status === ProductionPlanStatus.Draft;
      } else if (filterBy === 'planned') {
        statusMatch = plan.status === ProductionPlanStatus.Planned;
      } else if (filterBy === 'in-progress') {
        statusMatch = plan.status === ProductionPlanStatus.InProgress;
      } else if (filterBy === 'completed') {
        statusMatch = plan.status === ProductionPlanStatus.Completed;
      } else if (filterBy === 'can-produce') {
        statusMatch = plan.canProduce;
      }

      return searchMatch && statusMatch;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'created':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'status':
          comparison = a.status - b.status;
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getStatusLabel = (status: ProductionPlanStatus) => {
    switch (status) {
      case ProductionPlanStatus.Draft:
        return 'Draft';
      case ProductionPlanStatus.Planned:
        return 'Planned';
      case ProductionPlanStatus.InProgress:
        return 'In Progress';
      case ProductionPlanStatus.Completed:
        return 'Completed';
      case ProductionPlanStatus.Cancelled:
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  const getStatusClass = (status: ProductionPlanStatus) => {
    switch (status) {
      case ProductionPlanStatus.Draft:
        return 'status-draft';
      case ProductionPlanStatus.Planned:
        return 'status-planned';
      case ProductionPlanStatus.InProgress:
        return 'status-in-progress';
      case ProductionPlanStatus.Completed:
        return 'status-completed';
      case ProductionPlanStatus.Cancelled:
        return 'status-cancelled';
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <div className="production-loading">
        <Loader2 size={32} className="animate-spin" />
        <p>Loading production data...</p>
      </div>
    );
  }

  return (
    <div className="production-container">
      <div className="production-header">
        <h1>
          <Factory size={24} style={{ marginRight: '12px', verticalAlign: 'middle' }} />
          Production Management
        </h1>
        <ProtectedButton
          requiredPermission={Permissions.CreateProductionPlan}
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={16} />
          Create Production Plan
        </ProtectedButton>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="production-stats">
          <div className="stat-card">
            <div className="stat-icon">
              <Package size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{statistics.totalPlans}</div>
              <div className="stat-label">Total Plans</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <CheckCircle size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{statistics.completedPlans}</div>
              <div className="stat-label">Completed</div>
            </div>
          </div>
          <div className={`stat-card ${statistics.inProgressPlans > 0 ? 'warning' : ''}`}>
            <div className="stat-icon">
              <Wrench size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{statistics.inProgressPlans}</div>
              <div className="stat-label">In Progress</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <BarChart3 size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{statistics.totalUnitsProduced}</div>
              <div className="stat-label">Units Produced</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="production-controls">
        <div className="search-container">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-container">
          <select 
            value={filterBy} 
            onChange={(e) => setFilterBy(e.target.value as typeof filterBy)}
            className="filter-select"
          >
            <option value="all">All Plans</option>
            <option value="draft">Draft</option>
            <option value="planned">Planned</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="can-produce">Can Produce</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Production Plans Table */}
      <div className="table-container">
        <table className="products-table">
          <thead>
            <tr>
              <th 
                className={`sortable ${sortBy === 'name' ? `sorted-${sortOrder}` : ''}`}
                onClick={() => handleSort('name')}
              >
                Plan Name
              </th>
              <th>Target Product</th>
              <th>Quantity</th>
              <th>Materials</th>
              <th>Time</th>
              <th 
                className={`sortable ${sortBy === 'status' ? `sorted-${sortOrder}` : ''}`}
                onClick={() => handleSort('status')}
              >
                Status
              </th>
              <th 
                className={`sortable ${sortBy === 'created' ? `sorted-${sortOrder}` : ''}`}
                onClick={() => handleSort('created')}
              >
                Created
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedPlans.length === 0 ? (
              <tr>
                <td colSpan={8} className="no-products">
                  {searchTerm || filterBy !== 'all' 
                    ? 'No production plans found matching your criteria.' 
                    : 'No production plans created. Create a plan to get started.'}
                </td>
              </tr>
            ) : (
              filteredAndSortedPlans.map((plan) => (
                <tr key={plan.id} className={plan.status === ProductionPlanStatus.Cancelled ? 'inactive-product' : ''}>
                  <td className="product-name-cell">
                    <div className="product-name">{plan.name}</div>
                    {plan.description && (
                      <div className="product-description">{plan.description}</div>
                    )}
                  </td>
                  <td>
                    <div className="product-name">{plan.targetProductName}</div>
                    <div className="product-description">({plan.targetProductColor})</div>
                  </td>
                  <td className="quantity-cell">
                    {plan.quantityToProduce} {plan.targetProductQuantityType}
                  </td>
                  <td className="materials-cell">
                    <div className="materials-list">
                      {plan.requiredMaterials.slice(0, 2).map((material) => (
                        <div key={material.id} className="material-item">
                          <span className="material-name">{material.materialName}</span>
                          <span className={`material-quantity ${!material.isAvailable ? 'insufficient' : ''}`}>
                            {material.requiredQuantity * plan.quantityToProduce} {material.quantityType}
                          </span>
                        </div>
                      ))}
                      {plan.requiredMaterials.length > 2 && (
                        <div className="materials-more">
                          +{plan.requiredMaterials.length - 2} more
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="time-cell">{formatTime(plan.estimatedProductionTimeMinutes)}</td>
                  <td className="status-cell">
                    <div className="status-badges">
                      <span className={`status-badge ${getStatusClass(plan.status)}`}>
                        {getStatusLabel(plan.status)}
                      </span>
                      {plan.status !== ProductionPlanStatus.Completed && plan.status !== ProductionPlanStatus.Cancelled && (
                        <span className={`production-badge ${plan.canProduce ? 'can-produce' : 'cannot-produce'}`}>
                          {plan.canProduce ? 'Ready' : 'Not Ready'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>{formatDate(plan.createdAt)}</td>
                  <td className="actions-cell">
                    <div className="action-buttons">
                      <ProtectedButton
                        requiredPermission={Permissions.ViewProductionPlan}
                        className="btn btn-sm btn-info"
                        title="View Plan Details"
                        onClick={() => handleViewPlan(plan)}
                      >
                        <Eye size={16} />
                      </ProtectedButton>
                      
                      {/* Edit button - only for Draft status */}
                      {plan.status === ProductionPlanStatus.Draft && (
                        <ProtectedButton
                          requiredPermission={Permissions.EditProductionPlan}
                          className="btn btn-sm btn-primary"
                          title="Edit Plan"
                          onClick={() => handleEditPlan(plan)}
                        >
                          <Edit size={16} />
                        </ProtectedButton>
                      )}
                      
                      {/* Start Processing button - only for Draft and Planned status */}
                      {(plan.status === ProductionPlanStatus.Draft || plan.status === ProductionPlanStatus.Planned) && (
                        <ProtectedButton
                          requiredPermission={Permissions.ExecuteProductionPlan}
                          className={`btn btn-sm btn-success ${!plan.canProduce ? 'disabled' : ''}`}
                          title={plan.canProduce ? "Start Processing" : "Cannot start - missing materials"}
                          onClick={() => plan.canProduce && handleExecutePlan(plan.id)}
                          disabled={!plan.canProduce}
                        >
                          <Play size={16} />
                        </ProtectedButton>
                      )}
                      
                      {/* Complete Production button - only for In Progress status */}
                      {plan.status === ProductionPlanStatus.InProgress && (
                        <ProtectedButton
                          requiredPermission={Permissions.ReceiveProduction}
                          className="btn btn-sm btn-success"
                          title="Complete Production"
                          onClick={() => handleReceivePlan(plan)}
                        >
                          <Truck size={16} />
                        </ProtectedButton>
                      )}
                      
                      {/* Cancel button - for Draft, Planned, and In Progress status */}
                      {plan.status !== ProductionPlanStatus.Completed && plan.status !== ProductionPlanStatus.Cancelled && (
                        <ProtectedButton
                          requiredPermission={Permissions.CancelProductionPlan}
                          className="btn btn-sm btn-warning" 
                          title="Cancel Plan"
                          onClick={() => handleCancelPlan(plan)}
                        >
                          <XCircle size={16} />
                        </ProtectedButton>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateProductionPlan
          onClose={() => setShowCreateModal(false)}
          onPlanCreated={handlePlanCreated}
        />
      )}

      {showCancelModal && selectedPlan && (
        <CancelProductionPlanModal
          plan={selectedPlan}
          onClose={handleCloseCancelModal}
          onConfirm={handleConfirmCancel}
          isLoading={isCancelling}
        />
      )}

      {showEditModal && editingPlan && (
        <EditProductionPlan
          plan={editingPlan}
          onClose={handleCloseEditModal}
          onPlanUpdated={handlePlanUpdated}
        />
      )}

      {showViewModal && viewingPlan && (
        <ViewProductionPlan
          plan={viewingPlan}
          onClose={handleCloseViewModal}
        />
      )}

      {showReceiveModal && receivingPlan && (
        <ReceiveProduction
          plan={receivingPlan}
          onClose={handleCloseReceiveModal}
          onPlanReceived={handlePlanReceived}
        />
      )}
    </div>
  );
};

export default Production;
