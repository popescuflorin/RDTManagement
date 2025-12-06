import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Factory, 
  Package, 
  CheckCircle, 
  Wrench, 
  BarChart3, 
  Plus, 
  Search, 
  Filter,
  Play,
  Truck,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Recycle,
  Loader2
} from 'lucide-react';
import { productionPlanApi } from '../../services/api';
import type { ProductionPlan, ProductionPlanStatistics, PagedResult, RecyclableProductionPlan } from '../../types';
import { ProductionPlanStatus } from '../../types';
import CreateProductionPlan from './CreateProductionPlan';
import CancelProductionPlanModal from './CancelProductionPlanModal';
import EditProductionPlan from './EditProductionPlan';
import ViewProductionPlan from './ViewProductionPlan';
import ViewRecyclableProductionPlan from './ViewRecyclableProductionPlan';
import EditRecyclableProductionPlan from './EditRecyclableProductionPlan';
import CancelRecyclableProductionPlanModal from './CancelRecyclableProductionPlanModal';
import ProcessRecyclableProductionPlanModal from './ProcessRecyclableProductionPlanModal';
import ReceiveProduction from './ReceiveProduction';
import CreateRecyclableProductionPlan from './CreateRecyclableProductionPlan';
import ProtectedButton from '../ProtectedButton';
import { Permissions } from '../../hooks/usePermissions';
import EditButton from '../atoms/EditButton';
import ViewButton from '../atoms/ViewButton';
import CancelButton from '../atoms/CancelButton';
import './Production.css';

const Production: React.FC = () => {
  const { t } = useTranslation(['production', 'common']);
  const [pagedData, setPagedData] = useState<PagedResult<ProductionPlan> | null>(null);
  const [recPagedData, setRecPagedData] = useState<PagedResult<RecyclableProductionPlan> | null>(null);
  const [statistics, setStatistics] = useState<ProductionPlanStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'rawMaterial' | 'recyclable'>('rawMaterial');
  
  // Pagination and filtering state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProductionPlanStatus | null>(null);
  const [sortBy, setSortBy] = useState<string>('CreatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateRecycleModal, setShowCreateRecycleModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<ProductionPlan | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ProductionPlan | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingPlan, setViewingPlan] = useState<ProductionPlan | null>(null);
  const [showViewRecModal, setShowViewRecModal] = useState(false);
  const [viewingRecPlan, setViewingRecPlan] = useState<RecyclableProductionPlan | null>(null);
  const [showEditRecModal, setShowEditRecModal] = useState(false);
  const [editingRecPlan, setEditingRecPlan] = useState<RecyclableProductionPlan | null>(null);
  const [showCancelRecModal, setShowCancelRecModal] = useState(false);
  const [cancellingRecPlan, setCancellingRecPlan] = useState<RecyclableProductionPlan | null>(null);
  const [isCancellingRec, setIsCancellingRec] = useState(false);
  const [showProcessRecModal, setShowProcessRecModal] = useState(false);
  const [processingRecPlan, setProcessingRecPlan] = useState<RecyclableProductionPlan | null>(null);
  const [isProcessingRec, setIsProcessingRec] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [receivingPlan, setReceivingPlan] = useState<ProductionPlan | null>(null);

  useEffect(() => {
    if (activeTab === 'rawMaterial') {
      loadData();
    } else {
      loadRecData();
    }
  }, [activeTab, currentPage, pageSize, searchTerm, statusFilter, sortBy, sortOrder]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [pagedResponse, statsResponse] = await Promise.all([
        productionPlanApi.getPlansPaged({
          page: currentPage,
          pageSize: pageSize,
          searchTerm: searchTerm || undefined,
          status: statusFilter ?? undefined,
          sortBy: sortBy,
          sortOrder: sortOrder
        }),
        productionPlanApi.getStatistics()
      ]);
      
      setPagedData(pagedResponse.data);
      setStatistics(statsResponse.data);
    } catch (err: any) {
      setError(err.response?.data?.message || t('messages.failedToLoad'));
    } finally {
      setIsLoading(false);
    }
  };

  // Recyclable plans loader
  const loadRecData = async () => {
    try {
      setIsLoading(true);
      const pagedResponse = await productionPlanApi.getRecyclablePlansPaged({
        page: currentPage,
        pageSize: pageSize,
        searchTerm: searchTerm || undefined,
        status: statusFilter ?? undefined,
        sortBy: sortBy,
        sortOrder: sortOrder
      });
      setRecPagedData(pagedResponse.data);
    } catch (err: any) {
      setError(err.response?.data?.message || t('messages.failedToLoadRecyclablePlans'));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanCreated = () => {
    setShowCreateModal(false);
    loadData(); // Reload data
  };

  const handleExecutePlan = async (planId: number) => {
    try {
      await productionPlanApi.startPlan(planId);
      loadData(); // Refresh all data after starting
    } catch (error: any) {
      console.error('Error starting plan:', error);
      setError(error.response?.data?.message || t('messages.failedToStart'));
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

  const handlePlanUpdated = () => {
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

  const handleViewRecPlan = (plan: RecyclableProductionPlan) => {
    setViewingRecPlan(plan);
    setShowViewRecModal(true);
  };

  const handleCloseViewRecModal = () => {
    setShowViewRecModal(false);
    setViewingRecPlan(null);
  };

  const handleEditRecPlan = (plan: RecyclableProductionPlan) => {
    setEditingRecPlan(plan);
    setShowEditRecModal(true);
  };

  const handleCloseEditRecModal = () => {
    setShowEditRecModal(false);
    setEditingRecPlan(null);
  };

  const handleRecPlanUpdated = () => {
    setShowEditRecModal(false);
    setEditingRecPlan(null);
    loadRecData();
  };

  const handleCancelRecPlan = (plan: RecyclableProductionPlan) => {
    setCancellingRecPlan(plan);
    setShowCancelRecModal(true);
  };

  const handleConfirmCancelRec = async () => {
    if (!cancellingRecPlan) return;
    try {
      setIsCancellingRec(true);
      await productionPlanApi.cancelRecyclablePlan(cancellingRecPlan.id);
      setShowCancelRecModal(false);
      setCancellingRecPlan(null);
      loadRecData();
    } catch (err: any) {
      console.error('Error cancelling recyclable plan', err);
      setIsCancellingRec(false);
    } finally {
      setIsCancellingRec(false);
    }
  };

  const canProcessRec = (plan: RecyclableProductionPlan) => {
    return plan.requiredRecyclables.every(m => (m.availableQuantity ?? 0) >= (m.requiredQuantity * plan.quantityToProduce));
  };

  const handleOpenProcessRec = (plan: RecyclableProductionPlan) => {
    setProcessingRecPlan(plan);
    setShowProcessRecModal(true);
  };

  const handleConfirmProcessRec = async () => {
    if (!processingRecPlan) return;
    try {
      setIsProcessingRec(true);
      await productionPlanApi.executeRecyclablePlan(processingRecPlan.id);
      setShowProcessRecModal(false);
      setProcessingRecPlan(null);
      loadRecData();
    } catch (err: any) {
      console.error('Error processing recyclable plan', err);
      setIsProcessingRec(false);
    } finally {
      setIsProcessingRec(false);
    }
  };

  const handleReceivePlan = (plan: ProductionPlan) => {
    setReceivingPlan(plan);
    setShowReceiveModal(true);
  };

  const handleCloseReceiveModal = () => {
    setShowReceiveModal(false);
    setReceivingPlan(null);
  };

  const handlePlanReceived = () => {
    setShowReceiveModal(false);
    setReceivingPlan(null);
    loadData();
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      // Toggle sort order if clicking the same column
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to descending
      setSortBy(column);
      setSortOrder('desc');
    }
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) {
      return <ArrowUpDown size={14} className="sort-icon inactive" />;
    }
    return sortOrder === 'asc' 
      ? <ArrowUp size={14} className="sort-icon active" />
      : <ArrowDown size={14} className="sort-icon active" />;
  };

  const plans = pagedData?.items || [];
  const recPlans = recPagedData?.items || [];

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
        return t('status.draft');
      case ProductionPlanStatus.Planned:
        return t('status.planned');
      case ProductionPlanStatus.InProgress:
        return t('status.inProgress');
      case ProductionPlanStatus.Completed:
        return t('status.completed');
      case ProductionPlanStatus.Cancelled:
        return t('status.cancelled');
      default:
        return t('status.unknown');
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
        <p>{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="production-container">
      <div className="production-header">
        <div className="header-left">
          <h1>
            <Factory size={24} style={{ marginRight: '12px', verticalAlign: 'middle' }} />
            {t('productionManagement')}
          </h1>
          <p>{t('subtitle')}</p>
        </div>
        <div className="header-right">
          {activeTab === 'rawMaterial' && (
            <ProtectedButton
              requiredPermission={Permissions.CreateProductionPlan}
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={16} />
              {t('buttons.createProductionPlan')}
            </ProtectedButton>
          )}
          {activeTab === 'recyclable' && (
            <ProtectedButton
              requiredPermission={Permissions.CreateProductionPlan}
              className="btn btn-primary"
              onClick={() => setShowCreateRecycleModal(true)}
            >
              <Plus size={16} />
              {t('buttons.createRecyclablesPlan')}
            </ProtectedButton>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'rawMaterial' ? 'active' : ''}`}
          onClick={() => setActiveTab('rawMaterial')}
        >
          <Package size={18} />
          {t('tabs.rawMaterialProcessing')}
        </button>
        <button
          className={`tab-button ${activeTab === 'recyclable' ? 'active' : ''}`}
          onClick={() => setActiveTab('recyclable')}
        >
          <Recycle size={18} />
          {t('tabs.recyclableMaterialsProcessing')}
        </button>
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
              <div className="stat-label">{t('statistics.totalPlans')}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <CheckCircle size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{statistics.completedPlans}</div>
              <div className="stat-label">{t('statistics.completed')}</div>
            </div>
          </div>
          <div className={`stat-card ${statistics.inProgressPlans > 0 ? 'warning' : ''}`}>
            <div className="stat-icon">
              <Wrench size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{statistics.inProgressPlans}</div>
              <div className="stat-label">{t('statistics.inProgress')}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <BarChart3 size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{statistics.totalUnitsProduced}</div>
              <div className="stat-label">{t('statistics.unitsProduced')}</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'rawMaterial' && (
        <>
          {/* Filters and Search */}
          <div className="production-controls">
            <div className="search-container">
              <div className="search-input-wrapper">
                <Search size={20} className="search-icon" />
                <input
                  type="text"
                  placeholder={t('filters.searchPlans')}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1); // Reset to first page on search
                  }}
                  className="search-input"
                />
              </div>
            </div>
            
            {/* Status Filter */}
            <div className="filter-container">
              <Filter size={20} className="filter-icon" />
              <select
                value={statusFilter ?? ''}
                onChange={(e) => {
                  setStatusFilter(e.target.value ? Number(e.target.value) as ProductionPlanStatus : null);
                  setCurrentPage(1);
                }}
                className="filter-select"
              >
                <option value="">All Status</option>
                <option value={ProductionPlanStatus.Draft}>Draft</option>
                <option value={ProductionPlanStatus.Planned}>Planned</option>
                <option value={ProductionPlanStatus.InProgress}>In Progress</option>
                <option value={ProductionPlanStatus.Completed}>Completed</option>
                <option value={ProductionPlanStatus.Cancelled}>Cancelled</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </>
      )}

      {activeTab === 'rawMaterial' && (
        <>
          {/* Production Plans Table */}
          <div className="table-container">
            <table className="products-table">
              <thead>
                <tr>
                  <th className="sortable" onClick={() => handleSort('Name')}>
                    <div className="th-content">
                      <span>{t('table.planName')}</span>
                      {getSortIcon('Name')}
                    </div>
                  </th>
                  <th>{t('table.targetProduct')}</th>
                  <th>{t('table.quantity')}</th>
                  <th>{t('table.materials')}</th>
                  <th>{t('table.time')}</th>
                  <th className="sortable" onClick={() => handleSort('Status')}>
                    <div className="th-content">
                      <span>{t('table.status')}</span>
                      {getSortIcon('Status')}
                    </div>
                  </th>
                  <th className="sortable" onClick={() => handleSort('CreatedAt')}>
                    <div className="th-content">
                      <span>{t('table.created')}</span>
                      {getSortIcon('CreatedAt')}
                    </div>
                  </th>
                  <th>{t('table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {plans.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="no-products">
                      {searchTerm || statusFilter !== null 
                        ? t('emptyState.noPlansFound')
                        : t('emptyState.noPlansCreated')}
                    </td>
                  </tr>
                ) : (
                  plans.map((plan) => (
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
                              +{plan.requiredMaterials.length - 2} {t('table.more')}
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
                              {plan.canProduce ? t('badges.ready') : t('badges.notReady')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>{formatDate(plan.createdAt)}</td>
                      <td className="actions-cell">
                        <div className="action-buttons">
                          <ViewButton
                            requiredPermission={Permissions.ViewProductionPlan}
                            title={t('actions.viewPlanDetails')}
                            onClick={() => handleViewPlan(plan)}
                          />
                          
                          {/* Edit button - only for Draft status */}
                          {plan.status === ProductionPlanStatus.Draft && (
                            <EditButton
                              requiredPermission={Permissions.EditProductionPlan}
                              title={t('actions.editPlan')}
                              onClick={() => handleEditPlan(plan)}
                            />
                          )}
                          
                          {/* Start Processing button - only for Draft and Planned status */}
                          {(plan.status === ProductionPlanStatus.Draft || plan.status === ProductionPlanStatus.Planned) && (
                            <ProtectedButton
                              requiredPermission={Permissions.ExecuteProductionPlan}
                              className={`btn btn-sm btn-success ${!plan.canProduce ? 'disabled' : ''}`}
                              title={plan.canProduce ? t('actions.startProcessing') : t('actions.cannotStartMissingMaterials')}
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
                              title={t('actions.completeProduction')}
                              onClick={() => handleReceivePlan(plan)}
                            >
                              <Truck size={16} />
                            </ProtectedButton>
                          )}
                          
                          {/* Cancel button - for Draft, Planned, and In Progress status */}
                          {plan.status !== ProductionPlanStatus.Completed && plan.status !== ProductionPlanStatus.Cancelled && (
                            <CancelButton
                              requiredPermission={Permissions.CancelProductionPlan}
                              title={t('actions.cancelPlan')}
                              onClick={() => handleCancelPlan(plan)}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {pagedData && pagedData.totalPages > 0 && (
            <div className="pagination-container">
              <div className="pagination-info">
                {t('pagination.showing', {
                  start: ((pagedData.page - 1) * pagedData.pageSize) + 1,
                  end: Math.min(pagedData.page * pagedData.pageSize, pagedData.totalCount),
                  total: pagedData.totalCount
                })}
              </div>
              
              <div className="pagination-controls">
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(1)}
                  disabled={!pagedData.hasPreviousPage}
                >
                  {t('pagination.first')}
                </button>
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!pagedData.hasPreviousPage}
                >
                  <ChevronLeft size={16} />
                  {t('pagination.previous')}
                </button>
                
                <div className="pagination-pages">
                  {Array.from({ length: Math.min(5, pagedData.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagedData.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= pagedData.totalPages - 2) {
                      pageNum = pagedData.totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        className={`pagination-page ${currentPage === pageNum ? 'active' : ''}`}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!pagedData.hasNextPage}
                >
                  {t('pagination.next')}
                  <ChevronRight size={16} />
                </button>
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(pagedData.totalPages)}
                  disabled={!pagedData.hasNextPage}
                >
                  {t('pagination.last')}
                </button>
              </div>
              
              <div className="page-size-selector">
                <label>{t('pagination.show')}</label>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span>{t('pagination.perPage')}</span>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'recyclable' && (
        <>
          {/* Filters and Search */}
          <div className="production-controls">
            <div className="search-container">
              <div className="search-input-wrapper">
                <Search size={20} className="search-icon" />
                <input
                  type="text"
                  placeholder={t('filters.searchRecyclablePlans')}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="search-input"
                />
              </div>
            </div>
            <div className="filter-container">
              <Filter size={20} className="filter-icon" />
              <select
                value={statusFilter ?? ''}
                onChange={(e) => {
                  setStatusFilter(e.target.value ? Number(e.target.value) as ProductionPlanStatus : null);
                  setCurrentPage(1);
                }}
                className="filter-select"
              >
                <option value="">{t('filters.allStatus')}</option>
                <option value={ProductionPlanStatus.Draft}>{t('status.draft')}</option>
                <option value={ProductionPlanStatus.Planned}>{t('status.planned')}</option>
                <option value={ProductionPlanStatus.InProgress}>{t('status.inProgress')}</option>
                <option value={ProductionPlanStatus.Completed}>{t('status.completed')}</option>
                <option value={ProductionPlanStatus.Cancelled}>{t('status.cancelled')}</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="error-message">{error}</div>
          )}

          {/* Recyclable Plans Table */}
          <div className="table-container">
            <table className="products-table">
              <thead>
                <tr>
                  <th className="sortable" onClick={() => handleSort('Name')}>
                    <div className="th-content">
                      <span>{t('table.planName')}</span>
                      {getSortIcon('Name')}
                    </div>
                  </th>
                  <th>{t('table.targetRawMaterial')}</th>
                  <th>{t('table.quantity')}</th>
                  <th>{t('table.recyclables')}</th>
                  <th className="sortable" onClick={() => handleSort('Status')}>
                    <div className="th-content">
                      <span>{t('table.status')}</span>
                      {getSortIcon('Status')}
                    </div>
                  </th>
                  <th className="sortable" onClick={() => handleSort('CreatedAt')}>
                    <div className="th-content">
                      <span>{t('table.created')}</span>
                      {getSortIcon('CreatedAt')}
                    </div>
                  </th>
                  <th>{t('table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {recPlans.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="no-products">
                      {searchTerm || statusFilter !== null
                        ? t('emptyState.noRecyclablePlansFound')
                        : t('emptyState.noRecyclablePlansCreated')}
                    </td>
                  </tr>
                ) : (
                  recPlans.map((plan) => (
                    <tr key={plan.id} className={plan.status === ProductionPlanStatus.Cancelled ? 'inactive-product' : ''}>
                      <td className="product-name-cell">
                        <div className="product-name">{plan.name}</div>
                        {plan.description && (
                          <div className="product-description">{plan.description}</div>
                        )}
                      </td>
                      <td>
                        <div className="product-name">{plan.targetRawMaterialName}</div>
                        <div className="product-description">({plan.targetRawMaterialColor})</div>
                      </td>
                      <td className="quantity-cell">
                        {plan.quantityToProduce} {plan.targetRawMaterialQuantityType}
                      </td>
                      <td className="materials-cell">
                        <div className="materials-list">
                          {plan.requiredRecyclables.slice(0, 2).map((m) => (
                            <div key={m.id} className="material-item">
                              <span className="material-name">{m.materialName}</span>
                              <span className="material-quantity">
                                {m.requiredQuantity * plan.quantityToProduce} {m.quantityType}
                              </span>
                            </div>
                          ))}
                          {plan.requiredRecyclables.length > 2 && (
                            <div className="materials-more">+{plan.requiredRecyclables.length - 2} {t('table.more')}</div>
                          )}
                        </div>
                      </td>
                      <td className="status-cell">
                        <span className={`status-badge ${getStatusClass(plan.status)}`}>
                          {getStatusLabel(plan.status)}
                        </span>
                      </td>
                      <td>{formatDate(plan.createdAt)}</td>
                      <td className="actions-cell">
                        <div className="action-buttons">
                          <ViewButton
                            requiredPermission={Permissions.ViewProductionPlan}
                            title={t('actions.viewPlanDetails')}
                            onClick={() => handleViewRecPlan(plan)}
                          />
                          {plan.status === ProductionPlanStatus.Draft && (
                            <EditButton
                              requiredPermission={Permissions.EditProductionPlan}
                              title={t('actions.editPlan')}
                              onClick={() => handleEditRecPlan(plan)}
                            />
                          )}
                          {plan.status !== ProductionPlanStatus.Completed && plan.status !== ProductionPlanStatus.Cancelled && (
                            <CancelButton
                              requiredPermission={Permissions.CancelProductionPlan}
                              title={t('actions.cancelPlan')}
                              onClick={() => handleCancelRecPlan(plan)}
                            />
                          )}
                          {(plan.status === ProductionPlanStatus.Draft || plan.status === ProductionPlanStatus.Planned) && (
                            <ProtectedButton
                              requiredPermission={Permissions.ExecuteProductionPlan}
                              className={`btn btn-sm btn-success ${!canProcessRec(plan) ? 'disabled' : ''}`}
                              title={canProcessRec(plan) ? t('actions.processPlan') : t('actions.cannotProcessMissingMaterials')}
                              onClick={() => canProcessRec(plan) && handleOpenProcessRec(plan)}
                              disabled={!canProcessRec(plan)}
                            >
                              <Play size={16} />
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

          {/* Pagination Controls */}
          {recPagedData && recPagedData.totalPages > 0 && (
            <div className="pagination-container">
              <div className="pagination-info">
                {t('pagination.showing', {
                  start: ((recPagedData.page - 1) * recPagedData.pageSize) + 1,
                  end: Math.min(recPagedData.page * recPagedData.pageSize, recPagedData.totalCount),
                  total: recPagedData.totalCount
                })}
              </div>
              <div className="pagination-controls">
                <button className="pagination-btn" onClick={() => setCurrentPage(1)} disabled={!recPagedData.hasPreviousPage}>{t('pagination.first')}</button>
                <button className="pagination-btn" onClick={() => setCurrentPage(currentPage - 1)} disabled={!recPagedData.hasPreviousPage}>
                  <ChevronLeft size={16} />
                  {t('pagination.previous')}
                </button>
                <div className="pagination-pages">
                  {Array.from({ length: Math.min(5, recPagedData.totalPages) }, (_, i) => {
                    let pageNum;
                    if (recPagedData.totalPages <= 5) pageNum = i + 1; else if (currentPage <= 3) pageNum = i + 1; else if (currentPage >= recPagedData.totalPages - 2) pageNum = recPagedData.totalPages - 4 + i; else pageNum = currentPage - 2 + i;
                    return (
                      <button key={pageNum} className={`pagination-page ${currentPage === pageNum ? 'active' : ''}`} onClick={() => setCurrentPage(pageNum)}>
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button className="pagination-btn" onClick={() => setCurrentPage(currentPage + 1)} disabled={!recPagedData.hasNextPage}>{t('pagination.next')}<ChevronRight size={16} /></button>
                <button className="pagination-btn" onClick={() => setCurrentPage(recPagedData.totalPages)} disabled={!recPagedData.hasNextPage}>{t('pagination.last')}</button>
              </div>
              <div className="page-size-selector">
                <label>{t('pagination.show')}</label>
                <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span>{t('pagination.perPage')}</span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateProductionPlan
          onClose={() => setShowCreateModal(false)}
          onPlanCreated={handlePlanCreated}
        />
      )}
      {showCreateRecycleModal && (
        <CreateRecyclableProductionPlan
          onClose={() => setShowCreateRecycleModal(false)}
          onPlanCreated={() => { setShowCreateRecycleModal(false); loadRecData(); }}
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

      {showViewRecModal && viewingRecPlan && (
        <ViewRecyclableProductionPlan
          plan={viewingRecPlan}
          onClose={handleCloseViewRecModal}
        />
      )}

      {showEditRecModal && editingRecPlan && (
        <EditRecyclableProductionPlan
          plan={editingRecPlan}
          onClose={handleCloseEditRecModal}
          onPlanUpdated={handleRecPlanUpdated}
        />
      )}

      {showCancelRecModal && cancellingRecPlan && (
        <CancelRecyclableProductionPlanModal
          plan={cancellingRecPlan}
          onClose={() => { setShowCancelRecModal(false); setCancellingRecPlan(null); }}
          onConfirm={handleConfirmCancelRec}
          isLoading={isCancellingRec}
        />
      )}

      {showProcessRecModal && processingRecPlan && (
        <ProcessRecyclableProductionPlanModal
          plan={processingRecPlan}
          onClose={() => { setShowProcessRecModal(false); setProcessingRecPlan(null); }}
          onConfirm={handleConfirmProcessRec}
          isLoading={isProcessingRec}
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
