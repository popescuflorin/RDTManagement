import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  UserCircle, 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { clientApi } from '../../services/api';
import type { Client, PagedResult } from '../../types';
import CreateClient from './CreateClient';
import EditClient from './EditClient';
import ViewClient from './ViewClient';
import ProtectedButton from '../ProtectedButton';
import { Permissions } from '../../hooks/usePermissions';
import './Clients.css';

const Clients: React.FC = () => {
  const { t } = useTranslation(['clients', 'common']);
  const [pagedData, setPagedData] = useState<PagedResult<Client> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const clientsSortBy = 'Name';
  const clientsSortOrder: 'asc' | 'desc' = 'asc';
  
  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Debounce search term - wait 500ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page when search changes
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [searchTerm]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, debouncedSearchTerm, showInactive]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await clientApi.getClientsPaged({
        page: currentPage,
        pageSize: pageSize,
        searchTerm: debouncedSearchTerm || undefined,
        isActive: showInactive ? undefined : true,
        sortBy: clientsSortBy,
        sortOrder: clientsSortOrder
      });
      setPagedData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || t('clients.messages.failedToLoadClients'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClient = () => {
    setSelectedClient(null);
    setShowCreateModal(true);
  };

  const handleClientCreated = () => {
    setShowCreateModal(false);
    loadData();
  };

  const handleViewClient = (client: Client) => {
    setSelectedClient(client);
    setShowViewModal(true);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setShowEditModal(true);
  };

  const handleClientUpdated = () => {
    setShowEditModal(false);
    setSelectedClient(null);
    loadData();
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedClient(null);
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setSelectedClient(null);
  };

  const handleDeleteClient = async (client: Client) => {
    if (!window.confirm(t('clients.messages.confirmDeactivate', { name: client.name }))) {
      return;
    }

    try {
      setIsDeleting(true);
      await clientApi.deleteClient(client.id);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || t('clients.messages.failedToDeactivateClient'));
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const clients = pagedData?.items || [];

  if (isLoading) {
    return (
      <div className="clients-loading">
        <Loader2 size={32} className="animate-spin" />
        <p>{t('clients.loading.loadingClients')}</p>
      </div>
    );
  }

  return (
    <div className="clients-container">
      <div className="clients-header">
        <h1>
          <UserCircle size={24} style={{ marginRight: '12px', verticalAlign: 'middle' }} />
          {t('clients.title')}
        </h1>
        <ProtectedButton
          requiredPermission={Permissions.CreateClient}
          className="btn btn-primary"
          onClick={handleCreateClient}
        >
          <Plus size={16} />
          {t('clients.buttons.createNewClient')}
        </ProtectedButton>
      </div>

      {/* Search and Filter */}
      <div className="clients-controls">
        <div className="search-container">
          <div className="search-input-wrapper">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder={t('clients.search.placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
        
        <div className="filter-container">
          <label className="filter-checkbox">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => {
                setShowInactive(e.target.checked);
                setCurrentPage(1); // Reset to first page on filter change
              }}
            />
            <span>{t('clients.filters.showInactive')}</span>
          </label>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button type="button" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Clients Table */}
      <div className="table-container">
        <table className="clients-table">
          <thead>
            <tr>
              <th>{t('clients.table.id')}</th>
              <th>{t('clients.table.name')}</th>
              <th>{t('clients.table.contact')}</th>
              <th>{t('clients.table.location')}</th>
              <th>{t('clients.table.totalOrders')}</th>
              <th>{t('clients.table.totalValue')}</th>
              <th>{t('clients.table.status')}</th>
              <th>{t('clients.table.createdAt')}</th>
              <th>{t('clients.table.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 ? (
              <tr>
                <td colSpan={9} className="no-data">
                  {searchTerm || showInactive
                    ? t('clients.empty.noClientsFound')
                    : t('clients.empty.noClientsCreateFirst')}
                </td>
              </tr>
            ) : (
              clients.map(client => (
                <tr key={client.id} className={!client.isActive ? 'inactive-row' : ''}>
                  <td>#{client.id}</td>
                  <td className="client-name">
                    <div>{client.name}</div>
                    {client.contactPerson && (
                      <div className="client-contact-person">{client.contactPerson}</div>
                    )}
                  </td>
                  <td>
                    <div className="contact-info">
                      {client.email && (
                        <div className="contact-item">
                          <Mail size={14} />
                          {client.email}
                        </div>
                      )}
                      {client.phone && (
                        <div className="contact-item">
                          <Phone size={14} />
                          {client.phone}
                        </div>
                      )}
                      {!client.email && !client.phone && <span className="no-contact">{t('clients.messages.notSet')}</span>}
                    </div>
                  </td>
                  <td>
                    {client.city || client.country ? (
                      <div className="location-info">
                        <MapPin size={14} />
                        {[client.city, client.country].filter(Boolean).join(', ')}
                      </div>
                    ) : (
                      <span>{t('clients.messages.notSet')}</span>
                    )}
                  </td>
                  <td>{client.totalOrders}</td>
                  <td className="currency-cell">{formatCurrency(client.totalOrderValue)}</td>
                  <td>
                    <span className={`status-badge ${client.isActive ? 'status-active' : 'status-inactive'}`}>
                      {client.isActive ? t('clients.status.active') : t('clients.status.inactive')}
                    </span>
                  </td>
                  <td>{formatDate(client.createdAt)}</td>
                  <td className="actions-cell">
                    <div className="action-buttons">
                      <ProtectedButton
                        requiredPermission={Permissions.ViewClient}
                        className="btn btn-sm btn-primary"
                        title={t('clients.tooltips.viewClient')}
                        onClick={() => handleViewClient(client)}
                      >
                        <Eye size={16} />
                      </ProtectedButton>
                      <ProtectedButton
                        requiredPermission={Permissions.EditClient}
                        className="btn btn-sm btn-primary"
                        title={t('clients.tooltips.editClient')}
                        onClick={() => handleEditClient(client)}
                      >
                        <Edit size={16} />
                      </ProtectedButton>
                      {client.isActive && (
                        <ProtectedButton
                          requiredPermission={Permissions.DeleteClient}
                          className="btn btn-sm btn-danger"
                          title={t('clients.tooltips.deactivateClient')}
                          onClick={() => handleDeleteClient(client)}
                          disabled={isDeleting}
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
            {t('clients.pagination.showing', {
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
              {t('clients.pagination.first')}
            </button>
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={!pagedData.hasPreviousPage}
            >
              <ChevronLeft size={16} />
              {t('clients.pagination.previous')}
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
              {t('clients.pagination.next')}
              <ChevronRight size={16} />
            </button>
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(pagedData.totalPages)}
              disabled={!pagedData.hasNextPage}
            >
              {t('clients.pagination.last')}
            </button>
          </div>
          
          <div className="page-size-selector">
            <label>{t('clients.pagination.show')}</label>
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
            <span>{t('clients.pagination.perPage')}</span>
          </div>
        </div>
      )}

      {/* Summary */}
      {pagedData && (
        <div className="clients-summary">
          <div className="summary-item">
            <strong>{t('clients.summary.totalClients')}</strong> {pagedData.totalCount}
          </div>
          <div className="summary-item">
            <strong>{t('clients.summary.active')}</strong> {clients.filter(c => c.isActive).length} {t('clients.summary.of')} {pagedData.totalCount}
          </div>
          <div className="summary-item">
            <strong>{t('clients.summary.inactive')}</strong> {clients.filter(c => !c.isActive).length} {t('clients.summary.of')} {pagedData.totalCount}
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateClient
          onClose={() => setShowCreateModal(false)}
          onClientCreated={handleClientCreated}
        />
      )}

      {showViewModal && selectedClient && (
        <ViewClient
          isOpen={showViewModal}
          onClose={handleCloseViewModal}
          client={selectedClient}
        />
      )}

      {showEditModal && selectedClient && (
        <EditClient
          isOpen={showEditModal}
          onClose={handleCloseEditModal}
          onSuccess={handleClientUpdated}
          client={selectedClient}
        />
      )}
    </div>
  );
};

export default Clients;

