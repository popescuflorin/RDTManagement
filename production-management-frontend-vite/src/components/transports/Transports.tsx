import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Truck, 
  Plus, 
  Search, 
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
import EditButton from '../atoms/EditButton';
import DeleteButton from '../atoms/DeleteButton';
import { Table } from '../atoms';
import type { TableColumn } from '../atoms';
import './Transports.css';

type TabType = 'transports' | 'records';

const Transports: React.FC = () => {
  const { t } = useTranslation(['transports', 'common']);
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
      setError(err.response?.data?.message || t('transports.messages.failedToLoadTransports'));
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
    if (!window.confirm(t('transports.messages.confirmDelete', { carName: transport.carName }))) {
      return;
    }

    try {
      setIsDeleting(true);
      await transportApi.deleteTransport(transport.id);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || t('transports.messages.failedToDeleteTransport'));
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
      setError(err.response?.data?.message || t('transports.messages.failedToLoadRecords'));
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
        <p>{t('transports.loading.loadingTransports')}</p>
      </div>
    );
  }

  return (
    <div className="transports-container">
      <div className="transports-header">
        <h1>
          <Truck size={24} style={{ marginRight: '12px', verticalAlign: 'middle' }} />
          {t('transports.title')}
        </h1>
        {activeTab === 'transports' && (
          <ProtectedButton
            requiredPermission={Permissions.CreateTransport}
            className="btn btn-primary"
            onClick={handleCreateTransport}
          >
            <Plus size={16} />
            {t('transports.buttons.createNewTransportVehicle')}
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
          {t('transports.tabs.transportVehicles')}
        </button>
        <button
          className={`tab-button ${activeTab === 'records' ? 'active' : ''}`}
          onClick={() => setActiveTab('records')}
        >
          <FileText size={18} />
          {t('transports.tabs.transportRecords')}
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
                  ? t('transports.search.vehicles')
                  : t('transports.search.records')
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
          {(() => {
            const columns: TableColumn<Transport>[] = [
              {
                key: 'id',
                label: t('transports.table.id'),
                render: (_, transport) => `#${transport.id}`
              },
              {
                key: 'carName',
                label: t('transports.table.carName'),
                render: (_, transport) => <span className="transport-name">{transport.carName}</span>,
                cellClassName: 'transport-name'
              },
              {
                key: 'numberPlate',
                label: t('transports.table.numberPlate'),
                render: (_, transport) => transport.numberPlate || t('transports.messages.notSet')
              },
              {
                key: 'phoneNumber',
                label: t('transports.table.phoneNumber'),
                render: (_, transport) => transport.phoneNumber
              },
              {
                key: 'createdAt',
                label: t('transports.table.createdAt'),
                render: (_, transport) => formatDate(transport.createdAt)
              },
              {
                key: 'updatedAt',
                label: t('transports.table.updatedAt'),
                render: (_, transport) => transport.updatedAt ? formatDate(transport.updatedAt) : t('transports.messages.notSet')
              },
              {
                key: 'actions',
                label: t('transports.table.actions'),
                render: (_, transport) => (
                  <div className="action-buttons">
                    <EditButton
                      requiredPermission={Permissions.EditTransport}
                      title={t('transports.tooltips.editTransport')}
                      onClick={() => handleEditTransport(transport)}
                    />
                    <DeleteButton
                      requiredPermission={Permissions.DeleteTransport}
                      title={t('transports.tooltips.deleteTransport')}
                      onClick={() => handleDeleteTransport(transport)}
                      disabled={isDeleting}
                    />
                  </div>
                ),
                cellClassName: 'actions-cell'
              }
            ];

            return (
              <Table
                columns={columns}
                data={transports}
                emptyMessage={searchTerm 
                  ? t('transports.empty.noTransportsFound')
                  : t('transports.empty.noTransportsCreateFirst')}
              />
            );
          })()}

          {/* Pagination Controls */}
          {pagedTransports && pagedTransports.totalPages > 0 && (
            <div className="pagination-container">
              <div className="pagination-info">
                {t('transports.pagination.showing', {
                  start: ((pagedTransports.page - 1) * pagedTransports.pageSize) + 1,
                  end: Math.min(pagedTransports.page * pagedTransports.pageSize, pagedTransports.totalCount),
                  total: pagedTransports.totalCount
                })}
              </div>
              
              <div className="pagination-controls">
                <button
                  className="pagination-btn"
                  onClick={() => setTransportsPage(1)}
                  disabled={!pagedTransports.hasPreviousPage}
                >
                  {t('transports.pagination.first')}
                </button>
                <button
                  className="pagination-btn"
                  onClick={() => setTransportsPage(transportsPage - 1)}
                  disabled={!pagedTransports.hasPreviousPage}
                >
                  <ChevronLeft size={16} />
                  {t('transports.pagination.previous')}
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
                  {t('transports.pagination.next')}
                  <ChevronRight size={16} />
                </button>
                <button
                  className="pagination-btn"
                  onClick={() => setTransportsPage(pagedTransports.totalPages)}
                  disabled={!pagedTransports.hasNextPage}
                >
                  {t('transports.pagination.last')}
                </button>
              </div>
              
              <div className="page-size-selector">
                <label>{t('transports.pagination.show')}</label>
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
                <span>{t('transports.pagination.perPage')}</span>
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
              {t('transports.buttons.createTransportRecord')}
            </ProtectedButton>
          </div>

          {isLoadingRecords ? (
            <div className="transports-loading">
              <Loader2 size={32} className="animate-spin" />
              <p>{t('transports.loading.loadingRecords')}</p>
            </div>
          ) : (
            <>
              {(() => {
                const columns: TableColumn<TransportRecord>[] = [
                  {
                    key: 'type',
                    label: t('transports.table.type'),
                    render: (_, record) => (
                      <span className={`record-type-badge ${record.type.toLowerCase()}`}>
                        {record.type === 'Acquisition' ? (
                          <FileText size={14} style={{ marginRight: '4px' }} />
                        ) : (
                          <ClipboardList size={14} style={{ marginRight: '4px' }} />
                        )}
                        {record.type}
                      </span>
                    )
                  },
                  {
                    key: 'relatedEntity',
                    label: t('transports.table.relatedEntity'),
                    render: (_, record) => (
                      <div className="related-entity">
                        <strong>#{record.relatedEntityId}</strong>
                        <span className="entity-name">{record.relatedEntityName}</span>
                      </div>
                    )
                  },
                  {
                    key: 'carName',
                    label: t('transports.table.carName'),
                    render: (_, record) => <span className="transport-name">{record.carName}</span>,
                    cellClassName: 'transport-name'
                  },
                  {
                    key: 'numberPlate',
                    label: t('transports.table.numberPlate'),
                    render: (_, record) => record.numberPlate ?? t('transports.messages.notSet')
                  },
                  {
                    key: 'phoneNumber',
                    label: t('transports.table.phoneNumber'),
                    render: (_, record) => record.phoneNumber ?? t('transports.messages.notSet')
                  },
                  {
                    key: 'transportDate',
                    label: t('transports.table.transportDate'),
                    render: (_, record) => record.transportDate ? formatDate(record.transportDate) : t('transports.messages.notSet')
                  },
                  {
                    key: 'status',
                    label: t('transports.table.status'),
                    render: (_, record) => <span className="status-badge">{record.status}</span>
                  },
                  {
                    key: 'createdAt',
                    label: t('transports.table.createdAt'),
                    render: (_, record) => formatDateTime(record.createdAt)
                  }
                ];

                return (
                  <Table
                    columns={columns}
                    data={transportRecords}
                    getRowKey={(record) => `${record.type}-${record.id}`}
                    emptyMessage={recordsSearchTerm 
                      ? t('transports.empty.noRecordsFound')
                      : t('transports.empty.noRecords')}
                  />
                );
              })()}

              {/* Pagination Controls */}
              {pagedRecords && pagedRecords.totalPages > 0 && (
                <div className="pagination-container">
                  <div className="pagination-info">
                    {t('transports.pagination.showingRecords', {
                      start: ((pagedRecords.page - 1) * pagedRecords.pageSize) + 1,
                      end: Math.min(pagedRecords.page * pagedRecords.pageSize, pagedRecords.totalCount),
                      total: pagedRecords.totalCount
                    })}
                  </div>
                  
                  <div className="pagination-controls">
                    <button
                      className="pagination-btn"
                      onClick={() => setRecordsPage(1)}
                      disabled={!pagedRecords.hasPreviousPage}
                    >
                      {t('transports.pagination.first')}
                    </button>
                    <button
                      className="pagination-btn"
                      onClick={() => setRecordsPage(recordsPage - 1)}
                      disabled={!pagedRecords.hasPreviousPage}
                    >
                      <ChevronLeft size={16} />
                      {t('transports.pagination.previous')}
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
                      {t('transports.pagination.next')}
                      <ChevronRight size={16} />
                    </button>
                    <button
                      className="pagination-btn"
                      onClick={() => setRecordsPage(pagedRecords.totalPages)}
                      disabled={!pagedRecords.hasNextPage}
                    >
                      {t('transports.pagination.last')}
                    </button>
                  </div>
                  
                  <div className="page-size-selector">
                    <label>{t('transports.pagination.show')}</label>
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
                    <span>{t('transports.pagination.perPage')}</span>
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

