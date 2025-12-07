import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  UserCircle, 
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import { clientApi } from '../../services/api';
import type { Client, PagedResult } from '../../types';
import CreateClient from './CreateClient';
import EditClient from './EditClient';
import ViewClient from './ViewClient';
import DeleteClient from './DeleteClient';
import { Permissions } from '../../hooks/usePermissions';
import EditButton from '../atoms/EditButton';
import ViewButton from '../atoms/ViewButton';
import DeleteButton from '../atoms/DeleteButton';
import CreateButton from '../atoms/CreateButton';
import { Table, PageContainer, Loader, SearchInput, Pagination, Summary, ErrorMessage } from '../atoms';
import type { TableColumn } from '../atoms';
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
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

  const handleDeleteClient = (client: Client) => {
    setSelectedClient(client);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedClient) return;

    try {
      setIsDeleting(true);
      await clientApi.deleteClient(selectedClient.id);
      setShowDeleteModal(false);
      setSelectedClient(null);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || t('clients.messages.failedToDeactivateClient'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseDeleteModal = () => {
    if (!isDeleting) {
      setShowDeleteModal(false);
      setSelectedClient(null);
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
      currency: 'RON'
    }).format(amount);
  };

  const clients = pagedData?.items || [];

  if (isLoading) {
    return (
      <PageContainer>
        <Loader message={t('clients.loading.loadingClients')} />
      </PageContainer>
    );
  }

  return (
    <div className="clients-container">
      <div className="clients-header">
        <h1>
          <UserCircle size={24} style={{ marginRight: '12px', verticalAlign: 'middle' }} />
          {t('clients.title')}
        </h1>
        <CreateButton
          onClick={handleCreateClient}
          requiredPermission={Permissions.CreateClient}
          variant="primary"
        >
          {t('clients.buttons.createNewClient')}
        </CreateButton>
      </div>

      {/* Search and Filter */}
      <div className="clients-controls">
        <SearchInput
          placeholder={t('clients.search.placeholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
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
        <ErrorMessage
          message={error}
          onDismiss={() => setError(null)}
        />
      )}

      {/* Clients Table */}
      {(() => {
        const columns: TableColumn<Client>[] = [
          {
            key: 'id',
            label: t('clients.table.id'),
            render: (_, client) => `#${client.id}`
          },
          {
            key: 'name',
            label: t('clients.table.name'),
            render: (_, client) => (
              <div className="client-name">
                <div>{client.name}</div>
                {client.contactPerson && (
                  <div className="client-contact-person">{client.contactPerson}</div>
                )}
              </div>
            ),
            cellClassName: 'client-name'
          },
          {
            key: 'contact',
            label: t('clients.table.contact'),
            render: (_, client) => (
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
            )
          },
          {
            key: 'location',
            label: t('clients.table.location'),
            render: (_, client) => (
              client.city || client.country ? (
                <div className="location-info">
                  <MapPin size={14} />
                  {[client.city, client.country].filter(Boolean).join(', ')}
                </div>
              ) : (
                <span>{t('clients.messages.notSet')}</span>
              )
            )
          },
          {
            key: 'totalOrders',
            label: t('clients.table.totalOrders'),
            render: (_, client) => client.totalOrders
          },
          {
            key: 'totalValue',
            label: t('clients.table.totalValue'),
            render: (_, client) => <span className="currency-cell">{formatCurrency(client.totalOrderValue)}</span>
          },
          {
            key: 'status',
            label: t('clients.table.status'),
            render: (_, client) => (
              <span className={`status-badge ${client.isActive ? 'status-active' : 'status-inactive'}`}>
                {client.isActive ? t('clients.status.active') : t('clients.status.inactive')}
              </span>
            )
          },
          {
            key: 'createdAt',
            label: t('clients.table.createdAt'),
            render: (_, client) => formatDate(client.createdAt)
          },
          {
            key: 'actions',
            label: t('clients.table.actions'),
            render: (_, client) => (
              <div className="action-buttons">
                <ViewButton
                  requiredPermission={Permissions.ViewClient}
                  title={t('clients.tooltips.viewClient')}
                  onClick={() => handleViewClient(client)}
                />
                <EditButton
                  requiredPermission={Permissions.EditClient}
                  title={t('clients.tooltips.editClient')}
                  onClick={() => handleEditClient(client)}
                />
                {client.isActive && (
                  <DeleteButton
                    requiredPermission={Permissions.DeleteClient}
                    title={t('clients.tooltips.deactivateClient')}
                    onClick={() => handleDeleteClient(client)}
                    disabled={isDeleting}
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
            data={clients}
            getRowClassName={(client) => !client.isActive ? 'inactive-row' : ''}
            emptyMessage={searchTerm || showInactive
              ? t('clients.empty.noClientsFound')
              : t('clients.empty.noClientsCreateFirst')}
          />
        );
      })()}

      {/* Pagination Controls */}
      {pagedData && pagedData.totalPages > 0 && (
        <Pagination
          data={pagedData}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          labels={{
            showing: t('clients.pagination.showing', {
              start: ((pagedData.page - 1) * pagedData.pageSize) + 1,
              end: Math.min(pagedData.page * pagedData.pageSize, pagedData.totalCount),
              total: pagedData.totalCount
            }),
            first: t('clients.pagination.first'),
            previous: t('clients.pagination.previous'),
            next: t('clients.pagination.next'),
            last: t('clients.pagination.last'),
            show: t('clients.pagination.show'),
            perPage: t('clients.pagination.perPage')
          }}
        />
      )}

      {/* Summary */}
      {pagedData && (
        <Summary
          items={[
            {
              label: t('clients.summary.totalClients'),
              value: pagedData.totalCount
            },
            {
              label: t('clients.summary.active'),
              value: `${clients.filter(c => c.isActive).length} ${t('clients.summary.of')} ${pagedData.totalCount}`
            },
            {
              label: t('clients.summary.inactive'),
              value: `${clients.filter(c => !c.isActive).length} ${t('clients.summary.of')} ${pagedData.totalCount}`
            }
          ]}
        />
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateClient
          isOpen={showCreateModal}
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

      {showDeleteModal && selectedClient && (
        <DeleteClient
          isOpen={showDeleteModal}
          onClose={handleCloseDeleteModal}
          onConfirm={handleConfirmDelete}
          client={selectedClient}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
};

export default Clients;

