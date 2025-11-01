import React, { useState, useEffect } from 'react';
import { acquisitionApi } from '../../services/api';
import type { Acquisition as AcquisitionType, AcquisitionStatistics, PagedResult } from '../../types';
import { AcquisitionStatus, AcquisitionType as AcqType } from '../../types';
import { Plus, Edit, Trash2, Package, Search, Filter, Eye, Recycle, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import CreateAcquisition from './CreateAcquisition';
import EditAcquisition from './EditAcquisition';
import ReceiveAcquisition from './ReceiveAcquisition';
import ProcessAcquisition from './ProcessAcquisition';
import ViewAcquisition from './ViewAcquisition';
import ProtectedButton from '../ProtectedButton';
import { Permissions } from '../../hooks/usePermissions';
import './Acquisition.css';

const Acquisition: React.FC = () => {
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
      setError(err.response?.data?.message || 'Failed to load acquisition data');
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
      setError(err.response?.data?.message || 'Failed to cancel acquisition');
    }
  };

  const getStatusBadge = (status: AcquisitionStatus) => {
    const statusConfig = {
      [AcquisitionStatus.Draft]: { label: 'Draft', className: 'status-draft' },
      [AcquisitionStatus.Received]: { label: 'Received', className: 'status-received' },
      [AcquisitionStatus.Cancelled]: { label: 'Cancelled', className: 'status-cancelled' },
      [AcquisitionStatus.ReadyForProcessing]: { label: 'Ready for Processing', className: 'status-processing' }
    };

    const config = statusConfig[status];
    return <span className={`status-badge ${config.className}`}>{config.label}</span>;
  };

  const getTypeLabel = (type: AcqType) => {
    const typeLabels = {
      [AcqType.RawMaterials]: 'Raw Materials',
      [AcqType.RecyclableMaterials]: 'Recyclable Materials'
    };
    return typeLabels[type];
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
        <p>Loading acquisitions...</p>
      </div>
    );
  }

  return (
    <div className="acquisition-container">
      {/* Header */}
      <div className="acquisition-header">
        <div className="header-left">
          <h1>Acquisitions</h1>
          <p>Manage raw material orders and acquisitions</p>
        </div>
        <ProtectedButton
          className="add-acquisition-button"
          onClick={handleCreateAcquisition}
          requiredPermission={Permissions.CreateAcquisition}
        >
          <Plus size={20} />
          Create Acquisition
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
              <div className="stat-label">Total Acquisitions</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Edit size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{statistics.draftAcquisitions}</div>
              <div className="stat-label">Draft</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Package size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{statistics.receivedAcquisitions}</div>
              <div className="stat-label">Received</div>
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
              placeholder="Search acquisitions..."
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
            All Types
          </button>
          <button
            className={`filter-btn ${typeFilter === AcqType.RawMaterials ? 'active' : ''}`}
            onClick={() => {
              setTypeFilter(AcqType.RawMaterials);
              setCurrentPage(1);
            }}
          >
            Raw Materials
          </button>
          <button
            className={`filter-btn ${typeFilter === AcqType.RecyclableMaterials ? 'active' : ''}`}
            onClick={() => {
              setTypeFilter(AcqType.RecyclableMaterials);
              setCurrentPage(1);
            }}
          >
            Recyclable Materials
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
            <option value="">All Status</option>
            <option value={AcquisitionStatus.Draft}>Draft</option>
            <option value={AcquisitionStatus.Received}>Received</option>
            <option value={AcquisitionStatus.ReadyForProcessing}>Ready for Processing</option>
            <option value={AcquisitionStatus.Cancelled}>Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="acquisitions-table">
          <thead>
            <tr>
              <th className="status-bar-column"></th>
              <th className="sortable" onClick={() => handleSort('Title')}>
                <div className="th-content">
                  <span>Title</span>
                  {getSortIcon('Title')}
                </div>
              </th>
              <th>Type</th>
              <th className="sortable" onClick={() => handleSort('Status')}>
                <div className="th-content">
                  <span>Status</span>
                  {getSortIcon('Status')}
                </div>
              </th>
              <th>Assigned To</th>
              <th>Supplier</th>
              <th>Items</th>
              <th className="sortable" onClick={() => handleSort('DueDate')}>
                <div className="th-content">
                  <span>Due Date</span>
                  {getSortIcon('DueDate')}
                </div>
              </th>
              <th className="sortable" onClick={() => handleSort('CreatedAt')}>
                <div className="th-content">
                  <span>Created</span>
                  {getSortIcon('CreatedAt')}
                </div>
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {acquisitions.length === 0 ? (
              <tr>
                <td colSpan={10} className="empty-state">
                  <div className="empty-content">
                    <Package size={48} />
                    <h3>No acquisitions found</h3>
                    <p>{searchTerm || statusFilter !== null || typeFilter !== null 
                      ? 'No acquisitions match your filters' 
                      : 'Create your first acquisition to get started'}</p>
                    {!searchTerm && statusFilter === null && typeFilter === null && (
                      <ProtectedButton
                        className="empty-add-button"
                        onClick={handleCreateAcquisition}
                        requiredPermission={Permissions.CreateAcquisition}
                      >
                        <Plus size={20} />
                        Create Acquisition
                      </ProtectedButton>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              acquisitions.map((acquisition) => (
                <tr key={acquisition.id}>
                  <td className="status-bar-cell">
                    <div className={`status-bar status-${getDueDateStatus(acquisition)}`}></div>
                  </td>
                  <td>
                    <div className="acquisition-title">
                      <div className="title">{acquisition.title}</div>
                      {acquisition.description && (
                        <div className="description">{acquisition.description}</div>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="type-badge">
                      {getTypeLabel(acquisition.type)}
                    </span>
                  </td>
                  <td>{getStatusBadge(acquisition.status)}</td>
                  <td>
                    <div className="assigned-user-info">
                      {acquisition.assignedToUserName || 'Unassigned'}
                    </div>
                  </td>
                  <td>
                    <div className="supplier-info">
                      <div className="supplier-name">{acquisition.supplierName || '-'}</div>
                      {acquisition.supplierContact && (
                        <div className="supplier-contact">{acquisition.supplierContact}</div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="items-info">
                      <div className="items-count">{acquisition.totalItems} items</div>
                      <div className="total-quantity">{acquisition.totalQuantity} units</div>
                    </div>
                  </td>
                  <td>
                    <div className="due-date-info">
                      {acquisition.dueDate ? (
                        <div className="due-date">
                          {new Date(acquisition.dueDate).toLocaleDateString()}
                        </div>
                      ) : (
                        <div className="no-due-date">-</div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="date-info">
                      <div className="created-date">
                        {new Date(acquisition.createdAt).toLocaleDateString()}
                      </div>
                      <div className="created-by">
                        by {acquisition.createdByUserName}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <ProtectedButton
                        className="action-button view-button"
                        onClick={() => handleViewAcquisition(acquisition)}
                        title="View"
                        requiredPermission={Permissions.ViewAcquisition}
                      >
                        <Eye size={16} />
                      </ProtectedButton>
                      {acquisition.canEdit && (
                        <ProtectedButton
                          className="action-button edit-button"
                          onClick={() => handleEditAcquisition(acquisition)}
                          title="Edit"
                          requiredPermission={Permissions.EditAcquisition}
                        >
                          <Edit size={16} />
                        </ProtectedButton>
                      )}
                      {acquisition.canReceive && (
                        <ProtectedButton
                          className="action-button receive-button"
                          onClick={() => handleReceiveAcquisition(acquisition)}
                          title="Receive"
                          requiredPermission={Permissions.ReceiveAcquisition}
                        >
                          <Package size={16} />
                        </ProtectedButton>
                      )}
                      {acquisition.status === AcquisitionStatus.ReadyForProcessing && (
                        <ProtectedButton
                          className="action-button process-button"
                          onClick={() => handleProcessAcquisition(acquisition)}
                          title="Process"
                          requiredPermission={Permissions.ProcessAcquisition}
                        >
                          <Recycle size={16} />
                        </ProtectedButton>
                      )}
                      {acquisition.canDelete && (
                        <ProtectedButton
                          className="action-button delete-button"
                          onClick={() => handleDeleteAcquisition(acquisition)}
                          title="Delete"
                          requiredPermission={Permissions.CancelAcquisition}
                        >
                          <Trash2 size={16} />
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
      {pagedData && pagedData.totalPages > 0 && (
        <div className="pagination-container">
          <div className="pagination-info">
            Showing {((pagedData.page - 1) * pagedData.pageSize) + 1} to {Math.min(pagedData.page * pagedData.pageSize, pagedData.totalCount)} of {pagedData.totalCount} acquisitions
          </div>
          
          <div className="pagination-controls">
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(1)}
              disabled={!pagedData.hasPreviousPage}
            >
              First
            </button>
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={!pagedData.hasPreviousPage}
            >
              <ChevronLeft size={16} />
              Previous
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
              Next
              <ChevronRight size={16} />
            </button>
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(pagedData.totalPages)}
              disabled={!pagedData.hasNextPage}
            >
              Last
            </button>
          </div>
          
          <div className="page-size-selector">
            <label>Show:</label>
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
            <span>per page</span>
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
            <h2>Cancel Acquisition</h2>
            <p>Are you sure you want to cancel "{selectedAcquisition.title}"?</p>
            <p className="warning-text">This will mark the acquisition as cancelled and it cannot be received.</p>
            <div className="modal-actions">
              <button 
                className="cancel-button"
                onClick={() => setShowDeleteModal(false)}
              >
                Go Back
              </button>
              <button 
                className="delete-button"
                onClick={handleDelete}
              >
                Cancel Acquisition
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
