import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { acquisitionApi } from '../../services/api';
import type { Acquisition as AcquisitionType, AcquisitionStatistics, PagedResult } from '../../types';
import { AcquisitionStatus, AcquisitionType as AcqType } from '../../types';
import { Plus, Package, Search, Filter, Recycle, ChevronLeft, ChevronRight, Edit } from 'lucide-react';
import CreateAcquisition from './CreateAcquisition';
import EditAcquisition from './EditAcquisition';
import ReceiveAcquisition from './ReceiveAcquisition';
import ProcessAcquisition from './ProcessAcquisition';
import ViewAcquisition from './ViewAcquisition';
import ProtectedButton from '../ProtectedButton';
import { Permissions } from '../../hooks/usePermissions';
import EditButton from '../atoms/EditButton';
import ViewButton from '../atoms/ViewButton';
import DeleteButton from '../atoms/DeleteButton';
import { Table } from '../atoms';
import type { TableColumn } from '../atoms';
import './Acquisition.css';

const Acquisition: React.FC = () => {
  const { t } = useTranslation(['acquisitions', 'common']);
  const [pagedData, setPagedData] = useState<PagedResult<AcquisitionType> | null>(null);
  const [statistics, setStatistics] = useState<AcquisitionStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination and filtering state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<AcquisitionStatus | null>(null);
  const [typeFilter, setTypeFilter] = useState<AcqType | null>(null);
  const [sortBy, setSortBy] = useState<string>('CreatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedAcquisition, setSelectedAcquisition] = useState<AcquisitionType | null>(null);

  useEffect(() => {
    loadData();
  }, [currentPage, pageSize, searchTerm, statusFilter, typeFilter, sortBy, sortOrder]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [pagedResponse, statsResponse] = await Promise.all([
        acquisitionApi.getAcquisitionsPaged({
          page: currentPage,
          pageSize: pageSize,
          searchTerm: searchTerm || undefined,
          status: statusFilter ?? undefined,
          type: typeFilter ?? undefined,
          sortBy: sortBy,
          sortOrder: sortOrder
        }),
        acquisitionApi.getStatistics()
      ]);
      
      setPagedData(pagedResponse.data);
      setStatistics(statsResponse.data);
    } catch (err: any) {
      setError(err.response?.data?.message || t('messages.failedToLoad'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAcquisition = () => {
    setSelectedAcquisition(null);
    setShowCreateModal(true);
  };

  const handleEditAcquisition = (acquisition: AcquisitionType) => {
    setSelectedAcquisition(acquisition);
    setShowEditModal(true);
  };

  const handleDeleteAcquisition = (acquisition: AcquisitionType) => {
    setSelectedAcquisition(acquisition);
    setShowDeleteModal(true);
  };

  const handleReceiveAcquisition = (acquisition: AcquisitionType) => {
    setSelectedAcquisition(acquisition);
    setShowReceiveModal(true);
  };

  const handleViewAcquisition = (acquisition: AcquisitionType) => {
    setSelectedAcquisition(acquisition);
    setShowViewModal(true);
  };

  const handleProcessAcquisition = (acquisition: AcquisitionType) => {
    setSelectedAcquisition(acquisition);
    setShowProcessModal(true);
  };

  const handleDelete = async () => {
    if (!selectedAcquisition) return;

    try {
      // Cancel the acquisition (set status to Cancelled)
      await acquisitionApi.cancelAcquisition(selectedAcquisition.id);
      await loadData();
      setShowDeleteModal(false);
      setSelectedAcquisition(null);
    } catch (err: any) {
      setError(err.response?.data?.message || t('messages.failedToCancel'));
    }
  };

  const getStatusBadge = (status: AcquisitionStatus) => {
    const statusConfig = {
      [AcquisitionStatus.Draft]: { label: t('status.draft'), className: 'status-draft' },
      [AcquisitionStatus.Received]: { label: t('status.received'), className: 'status-received' },
      [AcquisitionStatus.Cancelled]: { label: t('status.cancelled'), className: 'status-cancelled' },
      [AcquisitionStatus.ReadyForProcessing]: { label: t('status.readyForProcessing'), className: 'status-processing' }
    };

    const config = statusConfig[status];
    return <span className={`status-badge ${config.className}`}>{config.label}</span>;
  };

  const getTypeLabel = (type: AcqType) => {
    const typeLabels = {
      [AcqType.RawMaterials]: t('type.rawMaterials'),
      [AcqType.RecyclableMaterials]: t('type.recyclableMaterials')
    };
    return typeLabels[type];
  };

  const handleSort = (column: string, order: 'asc' | 'desc') => {
    setSortBy(column);
    setSortOrder(order);
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  // Function to determine due date status
  const getDueDateStatus = (acquisition: AcquisitionType): 'green' | 'yellow' | 'red' | 'completed' => {
    // If acquisition is completed/received or ready for processing, show green
    if (acquisition.status === AcquisitionStatus.Received || acquisition.status === AcquisitionStatus.ReadyForProcessing) {
      return 'completed';
    }
    
    // If no due date, show green (no urgency)
    if (!acquisition.dueDate) {
      return 'green';
    }
    
    const dueDate = new Date(acquisition.dueDate);
    const today = new Date();
    const timeDiff = dueDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    // If due date has passed, show red
    if (daysDiff < 0) {
      return 'red';
    }
    
    // If due date is less than 5 days, show yellow
    if (daysDiff <= 5) {
      return 'yellow';
    }
    
    // If due date is more than 5 days, show green
    return 'green';
  };

  const acquisitions = pagedData?.items || [];

  if (isLoading) {
    return (
      <div className="acquisition-loading">
        <div className="loading-spinner"></div>
        <p>{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="acquisition-container">
      {/* Header */}
      <div className="acquisition-header">
        <div className="header-left">
          <h1>{t('title')}</h1>
          <p>{t('subtitle')}</p>
        </div>
        <ProtectedButton
          className="add-acquisition-button"
          onClick={handleCreateAcquisition}
          requiredPermission={Permissions.CreateAcquisition}
        >
          <Plus size={20} />
          {t('createAcquisition')}
        </ProtectedButton>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="acquisition-statistics">
          <div className="stat-card">
            <div className="stat-icon">
              <Package size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{statistics.totalAcquisitions}</div>
              <div className="stat-label">{t('statistics.totalAcquisitions')}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Edit size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{statistics.draftAcquisitions}</div>
              <div className="stat-label">{t('statistics.draft')}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Package size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{statistics.receivedAcquisitions}</div>
              <div className="stat-label">{t('statistics.received')}</div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Controls */}
      <div className="acquisition-controls">
        <div className="search-container">
          <div className="search-input-wrapper">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
              className="search-input"
            />
          </div>
        </div>
        
        {/* Type Filter Buttons */}
        <div className="filter-buttons">
          <button
            className={`filter-btn ${typeFilter === null ? 'active' : ''}`}
            onClick={() => {
              setTypeFilter(null);
              setCurrentPage(1);
            }}
          >
            {t('allTypes')}
          </button>
          <button
            className={`filter-btn ${typeFilter === AcqType.RawMaterials ? 'active' : ''}`}
            onClick={() => {
              setTypeFilter(AcqType.RawMaterials);
              setCurrentPage(1);
            }}
          >
            {t('type.rawMaterials')}
          </button>
          <button
            className={`filter-btn ${typeFilter === AcqType.RecyclableMaterials ? 'active' : ''}`}
            onClick={() => {
              setTypeFilter(AcqType.RecyclableMaterials);
              setCurrentPage(1);
            }}
          >
            {t('type.recyclableMaterials')}
          </button>
        </div>

        {/* Status Filter */}
        <div className="filter-container">
          <Filter size={20} className="filter-icon" />
          <select
            value={statusFilter ?? ''}
            onChange={(e) => {
              setStatusFilter(e.target.value ? Number(e.target.value) as AcquisitionStatus : null);
              setCurrentPage(1);
            }}
            className="filter-select"
          >
            <option value="">{t('allStatus')}</option>
            <option value={AcquisitionStatus.Draft}>{t('status.draft')}</option>
            <option value={AcquisitionStatus.Received}>{t('status.received')}</option>
            <option value={AcquisitionStatus.ReadyForProcessing}>{t('status.readyForProcessing')}</option>
            <option value={AcquisitionStatus.Cancelled}>{t('status.cancelled')}</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {acquisitions.length === 0 ? (
        <div className="table-container">
          <div className="empty-state">
            <div className="empty-content">
              <Package size={48} />
              <h3>{t('emptyState.noAcquisitions')}</h3>
              <p>{searchTerm || statusFilter !== null || typeFilter !== null 
                ? t('emptyState.noMatches')
                : t('emptyState.getStarted')}</p>
              {!searchTerm && statusFilter === null && typeFilter === null && (
                <ProtectedButton
                  className="empty-add-button"
                  onClick={handleCreateAcquisition}
                  requiredPermission={Permissions.CreateAcquisition}
                >
                  <Plus size={20} />
                  {t('createAcquisition')}
                </ProtectedButton>
              )}
            </div>
          </div>
        </div>
      ) : (
        (() => {
          const columns: TableColumn<AcquisitionType>[] = [
            {
              key: 'statusBar',
              label: '',
              render: (_, acquisition) => (
                <div className={`status-bar-cell status-bar status-${getDueDateStatus(acquisition)}`}></div>
              ),
              cellClassName: 'status-bar-cell',
              width: '4px'
            },
            {
              key: 'Title',
              label: t('table.title'),
              sortable: true,
              render: (_, acquisition) => (
                <div className="acquisition-title">
                  <div className="title">{acquisition.title}</div>
                  {acquisition.description && (
                    <div className="description">{acquisition.description}</div>
                  )}
                </div>
              )
            },
            {
              key: 'type',
              label: t('table.type'),
              render: (_, acquisition) => (
                <span className="type-badge">
                  {getTypeLabel(acquisition.type)}
                </span>
              )
            },
            {
              key: 'Status',
              label: t('table.status'),
              sortable: true,
              render: (_, acquisition) => getStatusBadge(acquisition.status)
            },
            {
              key: 'assignedTo',
              label: t('table.assignedTo'),
              render: (_, acquisition) => (
                <div className="assigned-user-info">
                  {acquisition.assignedToUserName || t('tableContent.unassigned')}
                </div>
              )
            },
            {
              key: 'supplier',
              label: t('table.supplier'),
              render: (_, acquisition) => (
                <div className="supplier-info">
                  <div className="supplier-name">{acquisition.supplierName || '-'}</div>
                  {acquisition.supplierContact && (
                    <div className="supplier-contact">{acquisition.supplierContact}</div>
                  )}
                </div>
              )
            },
            {
              key: 'items',
              label: t('table.items'),
              render: (_, acquisition) => (
                <div className="items-info">
                  <div className="items-count">{acquisition.totalItems} {t('tableContent.items')}</div>
                  <div className="total-quantity">{acquisition.totalQuantity} {t('tableContent.units')}</div>
                </div>
              )
            },
            {
              key: 'DueDate',
              label: t('table.dueDate'),
              sortable: true,
              render: (_, acquisition) => (
                <div className="due-date-info">
                  {acquisition.dueDate ? (
                    <div className="due-date">
                      {new Date(acquisition.dueDate).toLocaleDateString()}
                    </div>
                  ) : (
                    <div className="no-due-date">-</div>
                  )}
                </div>
              )
            },
            {
              key: 'CreatedAt',
              label: t('table.created'),
              sortable: true,
              render: (_, acquisition) => (
                <div className="date-info">
                  <div className="created-date">
                    {new Date(acquisition.createdAt).toLocaleDateString()}
                  </div>
                  <div className="created-by">
                    {t('tableContent.by')} {acquisition.createdByUserName}
                  </div>
                </div>
              )
            },
            {
              key: 'actions',
              label: t('table.actions'),
              render: (_, acquisition) => (
                <div className="action-buttons">
                  <ViewButton
                    onClick={() => handleViewAcquisition(acquisition)}
                    title={t('actions.view')}
                    requiredPermission={Permissions.ViewAcquisition}
                  />
                  {acquisition.canEdit && (
                    <EditButton
                      onClick={() => handleEditAcquisition(acquisition)}
                      title={t('actions.edit')}
                      requiredPermission={Permissions.EditAcquisition}
                    />
                  )}
                  {acquisition.canReceive && (
                    <ProtectedButton
                      className="action-button receive-button"
                      onClick={() => handleReceiveAcquisition(acquisition)}
                      title={t('actions.receive')}
                      requiredPermission={Permissions.ReceiveAcquisition}
                    >
                      <Package size={16} />
                    </ProtectedButton>
                  )}
                  {acquisition.status === AcquisitionStatus.ReadyForProcessing && 
                   acquisition.type === AcqType.RecyclableMaterials && (
                    <ProtectedButton
                      className="action-button receive-button"
                      onClick={() => handleProcessAcquisition(acquisition)}
                      title={t('actions.process')}
                      requiredPermission={Permissions.ProcessAcquisition}
                    >
                      <Recycle size={16} />
                    </ProtectedButton>
                  )}
                  {acquisition.canDelete && (
                    <DeleteButton
                      onClick={() => handleDeleteAcquisition(acquisition)}
                      title={t('actions.delete')}
                      requiredPermission={Permissions.CancelAcquisition}
                    />
                  )}
                </div>
              ),
              cellClassName: 'actions-cell'
            }
          ];

          return (
            <Table
              columns={columns}
              data={acquisitions}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort}
              emptyMessage=""
            />
          );
        })()
      )}

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

      {/* Modals */}
      <CreateAcquisition
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadData}
      />

      {showEditModal && selectedAcquisition && (
        <EditAcquisition
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={loadData}
          acquisition={selectedAcquisition}
        />
      )}

      {showDeleteModal && selectedAcquisition && (
        <div className="modal-backdrop" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{t('deleteModal.title')}</h2>
            <p>{t('deleteModal.confirmation', { title: selectedAcquisition.title })}</p>
            <p className="warning-text">{t('deleteModal.warning')}</p>
            <div className="modal-actions">
              <button 
                className="cancel-button"
                onClick={() => setShowDeleteModal(false)}
              >
                {t('deleteModal.goBack')}
              </button>
              <button 
                className="delete-button"
                onClick={handleDelete}
              >
                {t('deleteModal.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showReceiveModal && selectedAcquisition && (
        <ReceiveAcquisition
          isOpen={showReceiveModal}
          onClose={() => setShowReceiveModal(false)}
          onSuccess={loadData}
          acquisition={selectedAcquisition}
        />
      )}

      {showProcessModal && selectedAcquisition && (
        <ProcessAcquisition
          isOpen={showProcessModal}
          onClose={() => setShowProcessModal(false)}
          onSuccess={loadData}
          acquisition={selectedAcquisition}
        />
      )}

      {showViewModal && selectedAcquisition && (
        <ViewAcquisition
          isOpen={showViewModal}
          onClose={() => setShowViewModal(false)}
          acquisition={selectedAcquisition}
        />
      )}
    </div>
  );
};

export default Acquisition;
