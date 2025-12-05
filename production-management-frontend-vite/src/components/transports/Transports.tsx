import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  Loader2,
  FileText,
  ClipboardList,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { transportApi } from '../../services/api';
import type { Transport, TransportRecord, PagedResult } from '../../types';
import CreateTransport from './CreateTransport';
import EditTransport from './EditTransport';
import CreateTransportRecord from './CreateTransportRecord';
import ProtectedButton from '../ProtectedButton';
import { Permissions } from '../../hooks/usePermissions';
import './Transports.css';

type TabType = 'transports' | 'records';

const Transports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('transports');
  
  // Transport Vehicles pagination state
  const [pagedTransports, setPagedTransports] = useState<PagedResult<Transport> | null>(null);
  const [transportsPage, setTransportsPage] = useState(1);
  const [transportsPageSize, setTransportsPageSize] = useState(10);
  const transportsSortBy = 'CreatedAt';
  const transportsSortOrder: 'asc' | 'desc' = 'desc';
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Transport Records pagination state
  const [pagedRecords, setPagedRecords] = useState<PagedResult<TransportRecord> | null>(null);
  const [recordsPage, setRecordsPage] = useState(1);
  const [recordsPageSize, setRecordsPageSize] = useState(10);
  const recordsSortBy = 'TransportDate';
  const recordsSortOrder: 'asc' | 'desc' = 'desc';
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [recordsSearchTerm, setRecordsSearchTerm] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  
  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateRecordModal, setShowCreateRecordModal] = useState(false);
  const [selectedTransport, setSelectedTransport] = useState<Transport | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (activeTab === 'transports') {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, transportsPage, transportsPageSize, searchTerm]);

  useEffect(() => {
    if (activeTab === 'records') {
      loadTransportRecords();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, recordsPage, recordsPageSize, recordsSearchTerm]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await transportApi.getTransportsPaged({
        page: transportsPage,
        pageSize: transportsPageSize,
        searchTerm: searchTerm || undefined,
        sortBy: transportsSortBy,
        sortOrder: transportsSortOrder
      });
      setPagedTransports(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load transports');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTransport = () => {
    setSelectedTransport(null);
    setShowCreateModal(true);
  };

  const handleTransportCreated = () => {
    setShowCreateModal(false);
    loadData();
  };

  const handleEditTransport = (transport: Transport) => {
    setSelectedTransport(transport);
    setShowEditModal(true);
  };

  const handleTransportUpdated = () => {
    setShowEditModal(false);
    setSelectedTransport(null);
    loadData();
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedTransport(null);
  };

  const handleDeleteTransport = async (transport: Transport) => {
    if (!window.confirm(`Are you sure you want to delete transport "${transport.carName}"?`)) {
      return;
    }

    try {
      setIsDeleting(true);
      await transportApi.deleteTransport(transport.id);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete transport');
    } finally {
      setIsDeleting(false);
    }
  };

  const loadTransportRecords = async () => {
    try {
      setIsLoadingRecords(true);
      setError(null);

      const response = await transportApi.getTransportRecordsPaged({
        page: recordsPage,
        pageSize: recordsPageSize,
        searchTerm: recordsSearchTerm || undefined,
        sortBy: recordsSortBy,
        sortOrder: recordsSortOrder
      });

      setPagedRecords(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load transport records');
    } finally {
      setIsLoadingRecords(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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

  const transports = pagedTransports?.items || [];
  const transportRecords = pagedRecords?.items || [];

  if (isLoading && activeTab === 'transports') {
    return (
      <div className="transports-loading">
        <Loader2 size={32} className="animate-spin" />
        <p>Loading transports...</p>
      </div>
    );
  }

  return (
    <div className="transports-container">
      <div className="transports-header">
        <h1>
          <Truck size={24} style={{ marginRight: '12px', verticalAlign: 'middle' }} />
          Transports
        </h1>
        {activeTab === 'transports' && (
          <ProtectedButton
            requiredPermission={Permissions.CreateTransport}
            className="btn btn-primary"
            onClick={handleCreateTransport}
          >
            <Plus size={16} />
            Create New Transport Vehicle
          </ProtectedButton>
        )}
      </div>

      {/* Tabs */}
      <div className="transports-tabs">
        <button
          className={`tab-button ${activeTab === 'transports' ? 'active' : ''}`}
          onClick={() => setActiveTab('transports')}
        >
          <Truck size={18} />
          Transport Vehicles
        </button>
        <button
          className={`tab-button ${activeTab === 'records' ? 'active' : ''}`}
          onClick={() => setActiveTab('records')}
        >
          <FileText size={18} />
          Transport Records
        </button>
      </div>

      {/* Search */}
      <div className="transports-controls">
        <div className="search-container">
          <div className="search-input-wrapper">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder={
                activeTab === 'transports'
                  ? 'Search by car name, number plate, or phone...'
                  : 'Search by car name, number plate, phone, or related entity...'
              }
              value={activeTab === 'transports' ? searchTerm : recordsSearchTerm}
              onChange={(e) => {
                if (activeTab === 'transports') {
                  setSearchTerm(e.target.value);
                  setTransportsPage(1); // Reset to first page on search
                } else {
                  setRecordsSearchTerm(e.target.value);
                  setRecordsPage(1); // Reset to first page on search
                }
              }}
              className="search-input"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button type="button" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Transport Vehicles Tab Content */}
      {activeTab === 'transports' && (
        <>
          <div className="table-container">
            <table className="transports-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Car Name</th>
                  <th>Number Plate</th>
                  <th>Phone Number</th>
                  <th>Created At</th>
                  <th>Updated At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transports.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="no-data">
                      {searchTerm 
                        ? 'No transports found matching your search' 
                        : 'No transports found. Create your first transport!'}
                    </td>
                  </tr>
                ) : (
                  transports.map(transport => (
                    <tr key={transport.id}>
                      <td>#{transport.id}</td>
                      <td className="transport-name">{transport.carName}</td>
                      <td>{transport.numberPlate || '—'}</td>
                      <td>{transport.phoneNumber}</td>
                      <td>{formatDate(transport.createdAt)}</td>
                      <td>{transport.updatedAt ? formatDate(transport.updatedAt) : '—'}</td>
                      <td className="actions-cell">
                        <div className="action-buttons">
                          <ProtectedButton
                            requiredPermission={Permissions.EditTransport}
                            className="btn btn-sm btn-primary"
                            title="Edit Transport"
                            onClick={() => handleEditTransport(transport)}
                          >
                            <Edit size={16} />
                          </ProtectedButton>
                          <ProtectedButton
                            requiredPermission={Permissions.DeleteTransport}
                            className="btn btn-sm btn-danger"
                            title="Delete Transport"
                            onClick={() => handleDeleteTransport(transport)}
                            disabled={isDeleting}
                          >
                            <Trash2 size={16} />
                          </ProtectedButton>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {pagedTransports && pagedTransports.totalPages > 0 && (
            <div className="pagination-container">
              <div className="pagination-info">
                Showing {((pagedTransports.page - 1) * pagedTransports.pageSize) + 1} to {Math.min(pagedTransports.page * pagedTransports.pageSize, pagedTransports.totalCount)} of {pagedTransports.totalCount} transports
              </div>
              
              <div className="pagination-controls">
                <button
                  className="pagination-btn"
                  onClick={() => setTransportsPage(1)}
                  disabled={!pagedTransports.hasPreviousPage}
                >
                  First
                </button>
                <button
                  className="pagination-btn"
                  onClick={() => setTransportsPage(transportsPage - 1)}
                  disabled={!pagedTransports.hasPreviousPage}
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
                
                <div className="pagination-pages">
                  {Array.from({ length: Math.min(5, pagedTransports.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagedTransports.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (transportsPage <= 3) {
                      pageNum = i + 1;
                    } else if (transportsPage >= pagedTransports.totalPages - 2) {
                      pageNum = pagedTransports.totalPages - 4 + i;
                    } else {
                      pageNum = transportsPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        className={`pagination-page ${transportsPage === pageNum ? 'active' : ''}`}
                        onClick={() => setTransportsPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  className="pagination-btn"
                  onClick={() => setTransportsPage(transportsPage + 1)}
                  disabled={!pagedTransports.hasNextPage}
                >
                  Next
                  <ChevronRight size={16} />
                </button>
                <button
                  className="pagination-btn"
                  onClick={() => setTransportsPage(pagedTransports.totalPages)}
                  disabled={!pagedTransports.hasNextPage}
                >
                  Last
                </button>
              </div>
              
              <div className="page-size-selector">
                <label>Show:</label>
                <select
                  value={transportsPageSize}
                  onChange={(e) => {
                    setTransportsPageSize(Number(e.target.value));
                    setTransportsPage(1);
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
        </>
      )}

      {/* Transport Records Tab Content */}
      {activeTab === 'records' && (
        <>
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <ProtectedButton
              requiredPermission={Permissions.EditAcquisition}
              className="btn btn-primary"
              onClick={() => setShowCreateRecordModal(true)}
            >
              <Plus size={16} />
              Create Transport Record
            </ProtectedButton>
          </div>

          {isLoadingRecords ? (
            <div className="transports-loading">
              <Loader2 size={32} className="animate-spin" />
              <p>Loading transport records...</p>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="transports-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Related Entity</th>
                      <th>Car Name</th>
                      <th>Number Plate</th>
                      <th>Phone Number</th>
                      <th>Transport Date</th>
                      <th>Status</th>
                      <th>Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transportRecords.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="no-data">
                          {recordsSearchTerm 
                            ? 'No transport records found matching your search' 
                            : 'No transport records found.'}
                        </td>
                      </tr>
                    ) : (
                      transportRecords.map(record => (
                        <tr key={`${record.type}-${record.id}`}>
                          <td>
                            <span className={`record-type-badge ${record.type.toLowerCase()}`}>
                              {record.type === 'Acquisition' ? (
                                <FileText size={14} style={{ marginRight: '4px' }} />
                              ) : (
                                <ClipboardList size={14} style={{ marginRight: '4px' }} />
                              )}
                              {record.type}
                            </span>
                          </td>
                          <td>
                            <div className="related-entity">
                              <strong>#{record.relatedEntityId}</strong>
                              <span className="entity-name">{record.relatedEntityName}</span>
                            </div>
                          </td>
                          <td className="transport-name">{record.carName}</td>
                          <td>{record.numberPlate ?? '—'}</td>
                          <td>{record.phoneNumber ?? '—'}</td>
                          <td>{record.transportDate ? formatDate(record.transportDate) : '—'}</td>
                          <td>
                            <span className="status-badge">{record.status}</span>
                          </td>
                          <td>{formatDateTime(record.createdAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {pagedRecords && pagedRecords.totalPages > 0 && (
                <div className="pagination-container">
                  <div className="pagination-info">
                    Showing {((pagedRecords.page - 1) * pagedRecords.pageSize) + 1} to {Math.min(pagedRecords.page * pagedRecords.pageSize, pagedRecords.totalCount)} of {pagedRecords.totalCount} records
                  </div>
                  
                  <div className="pagination-controls">
                    <button
                      className="pagination-btn"
                      onClick={() => setRecordsPage(1)}
                      disabled={!pagedRecords.hasPreviousPage}
                    >
                      First
                    </button>
                    <button
                      className="pagination-btn"
                      onClick={() => setRecordsPage(recordsPage - 1)}
                      disabled={!pagedRecords.hasPreviousPage}
                    >
                      <ChevronLeft size={16} />
                      Previous
                    </button>
                    
                    <div className="pagination-pages">
                      {Array.from({ length: Math.min(5, pagedRecords.totalPages) }, (_, i) => {
                        let pageNum;
                        if (pagedRecords.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (recordsPage <= 3) {
                          pageNum = i + 1;
                        } else if (recordsPage >= pagedRecords.totalPages - 2) {
                          pageNum = pagedRecords.totalPages - 4 + i;
                        } else {
                          pageNum = recordsPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            className={`pagination-page ${recordsPage === pageNum ? 'active' : ''}`}
                            onClick={() => setRecordsPage(pageNum)}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      className="pagination-btn"
                      onClick={() => setRecordsPage(recordsPage + 1)}
                      disabled={!pagedRecords.hasNextPage}
                    >
                      Next
                      <ChevronRight size={16} />
                    </button>
                    <button
                      className="pagination-btn"
                      onClick={() => setRecordsPage(pagedRecords.totalPages)}
                      disabled={!pagedRecords.hasNextPage}
                    >
                      Last
                    </button>
                  </div>
                  
                  <div className="page-size-selector">
                    <label>Show:</label>
                    <select
                      value={recordsPageSize}
                      onChange={(e) => {
                        setRecordsPageSize(Number(e.target.value));
                        setRecordsPage(1);
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
            </>
          )}
        </>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateTransport
          onClose={() => setShowCreateModal(false)}
          onTransportCreated={handleTransportCreated}
        />
      )}

      {showEditModal && selectedTransport && (
        <EditTransport
          isOpen={showEditModal}
          onClose={handleCloseEditModal}
          onSuccess={handleTransportUpdated}
          transport={selectedTransport}
        />
      )}

      {showCreateRecordModal && (
        <CreateTransportRecord
          isOpen={showCreateRecordModal}
          onClose={() => setShowCreateRecordModal(false)}
          onSuccess={() => {
            setShowCreateRecordModal(false);
            loadTransportRecords();
          }}
        />
      )}
    </div>
  );
};

export default Transports;

