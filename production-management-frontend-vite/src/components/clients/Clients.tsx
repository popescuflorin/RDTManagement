import React, { useState, useEffect } from 'react';
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
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { clientApi } from '../../services/api';
import type { Client, PagedResult } from '../../types';
import CreateClient from './CreateClient';
import EditClient from './EditClient';
import ProtectedButton from '../ProtectedButton';
import { Permissions } from '../../hooks/usePermissions';
import './Clients.css';

const Clients: React.FC = () => {
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
      setError(err.response?.data?.message || 'Failed to load clients');
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

  const handleDeleteClient = async (client: Client) => {
    if (!window.confirm(`Are you sure you want to deactivate client "${client.name}"?`)) {
      return;
    }

    try {
      setIsDeleting(true);
      await clientApi.deleteClient(client.id);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to deactivate client');
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
        <p>Loading clients...</p>
      </div>
    );
  }

  return (
    <div className="clients-container">
      <div className="clients-header">
        <h1>
          <UserCircle size={24} style={{ marginRight: '12px', verticalAlign: 'middle' }} />
          Clients
        </h1>
        <ProtectedButton
          requiredPermission={Permissions.CreateClient}
          className="btn btn-primary"
          onClick={handleCreateClient}
        >
          <Plus size={16} />
          Create New Client
        </ProtectedButton>
      </div>

      {/* Search and Filter */}
      <div className="clients-controls">
        <div className="search-container">
          <div className="search-input-wrapper">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Search by name, contact, email, phone, city, or country..."
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
            <span>Show Inactive</span>
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
              <th>ID</th>
              <th>Name</th>
              <th>Contact</th>
              <th>Location</th>
              <th>Total Orders</th>
              <th>Total Value</th>
              <th>Status</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 ? (
              <tr>
                <td colSpan={9} className="no-data">
                  {searchTerm || showInactive
                    ? 'No clients found matching your criteria' 
                    : 'No clients found. Create your first client!'}
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
                      {!client.email && !client.phone && <span className="no-contact">—</span>}
                    </div>
                  </td>
                  <td>
                    {client.city || client.country ? (
                      <div className="location-info">
                        <MapPin size={14} />
                        {[client.city, client.country].filter(Boolean).join(', ')}
                      </div>
                    ) : (
                      <span>—</span>
                    )}
                  </td>
                  <td>{client.totalOrders}</td>
                  <td className="currency-cell">{formatCurrency(client.totalOrderValue)}</td>
                  <td>
                    <span className={`status-badge ${client.isActive ? 'status-active' : 'status-inactive'}`}>
                      {client.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{formatDate(client.createdAt)}</td>
                  <td className="actions-cell">
                    <div className="action-buttons">
                      <ProtectedButton
                        requiredPermission={Permissions.EditClient}
                        className="btn btn-sm btn-primary"
                        title="Edit Client"
                        onClick={() => handleEditClient(client)}
                      >
                        <Edit size={16} />
                      </ProtectedButton>
                      {client.isActive && (
                        <ProtectedButton
                          requiredPermission={Permissions.DeleteClient}
                          className="btn btn-sm btn-danger"
                          title="Deactivate Client"
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
            Showing {((pagedData.page - 1) * pagedData.pageSize) + 1} to {Math.min(pagedData.page * pagedData.pageSize, pagedData.totalCount)} of {pagedData.totalCount} clients
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

      {/* Summary */}
      {pagedData && (
        <div className="clients-summary">
          <div className="summary-item">
            <strong>Total Clients:</strong> {pagedData.totalCount}
          </div>
          <div className="summary-item">
            <strong>Active:</strong> {clients.filter(c => c.isActive).length} of {pagedData.totalCount}
          </div>
          <div className="summary-item">
            <strong>Inactive:</strong> {clients.filter(c => !c.isActive).length} of {pagedData.totalCount}
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

