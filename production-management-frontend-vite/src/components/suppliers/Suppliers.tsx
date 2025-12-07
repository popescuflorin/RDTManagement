import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Building2, 
  Plus, 
  Search, 
  Loader2,
  Mail,
  Phone,
  MapPin,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { supplierApi } from '../../services/api';
import type { Supplier, PagedResult } from '../../types';
import CreateSupplier from './CreateSupplier';
import EditSupplier from './EditSupplier';
import ViewSupplier from './ViewSupplier';
import ProtectedButton from '../ProtectedButton';
import { Permissions } from '../../hooks/usePermissions';
import EditButton from '../atoms/EditButton';
import ViewButton from '../atoms/ViewButton';
import DeleteButton from '../atoms/DeleteButton';
import CreateButton from '../atoms/CreateButton';
import { Table } from '../atoms';
import type { TableColumn } from '../atoms';
import './Suppliers.css';

const Suppliers: React.FC = () => {
  const { t } = useTranslation(['suppliers', 'common']);
  const [pagedData, setPagedData] = useState<PagedResult<Supplier> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const suppliersSortBy = 'Name';
  const suppliersSortOrder: 'asc' | 'desc' = 'asc';
  
  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
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
      const response = await supplierApi.getSuppliersPaged({
        page: currentPage,
        pageSize: pageSize,
        searchTerm: debouncedSearchTerm || undefined,
        isActive: showInactive ? undefined : true,
        sortBy: suppliersSortBy,
        sortOrder: suppliersSortOrder
      });
      setPagedData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || t('suppliers.messages.failedToLoadSuppliers'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSupplier = () => {
    setSelectedSupplier(null);
    setShowCreateModal(true);
  };

  const handleSupplierCreated = () => {
    setShowCreateModal(false);
    loadData();
  };

  const handleViewSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowViewModal(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowEditModal(true);
  };

  const handleSupplierUpdated = () => {
    setShowEditModal(false);
    setSelectedSupplier(null);
    loadData();
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedSupplier(null);
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setSelectedSupplier(null);
  };

  const handleDeleteSupplier = async (supplier: Supplier) => {
    if (!window.confirm(t('suppliers.messages.confirmDeactivate', { name: supplier.name }))) {
      return;
    }

    try {
      setIsDeleting(true);
      await supplierApi.deleteSupplier(supplier.id);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || t('suppliers.messages.failedToDeactivateSupplier'));
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

  const suppliers = pagedData?.items || [];

  if (isLoading) {
    return (
      <div className="suppliers-loading">
        <Loader2 size={32} className="animate-spin" />
        <p>{t('suppliers.loading.loadingSuppliers')}</p>
      </div>
    );
  }

  return (
    <div className="suppliers-container">
      <div className="suppliers-header">
        <h1>
          <Building2 size={24} style={{ marginRight: '12px', verticalAlign: 'middle' }} />
          {t('suppliers.title')}
        </h1>
        <CreateButton
          onClick={handleCreateSupplier}
          requiredPermission={Permissions.CreateSupplier}
          variant="primary"
        >
          {t('suppliers.buttons.createNewSupplier')}
        </CreateButton>
      </div>

      {/* Search and Filter */}
      <div className="suppliers-controls">
        <div className="search-container">
          <div className="search-input-wrapper">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder={t('suppliers.search.placeholder')}
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
            <span>{t('suppliers.filters.showInactive')}</span>
          </label>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button type="button" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Suppliers Table */}
      {(() => {
        const columns: TableColumn<Supplier>[] = [
          {
            key: 'id',
            label: t('suppliers.table.id'),
            render: (_, supplier) => `#${supplier.id}`
          },
          {
            key: 'name',
            label: t('suppliers.table.name'),
            render: (_, supplier) => (
              <div className="supplier-name">
                <div>{supplier.name}</div>
                {supplier.description && (
                  <div className="supplier-description">{supplier.description}</div>
                )}
                {supplier.contactPerson && (
                  <div className="supplier-contact-person">{supplier.contactPerson}</div>
                )}
              </div>
            ),
            cellClassName: 'supplier-name'
          },
          {
            key: 'contact',
            label: t('suppliers.table.contact'),
            render: (_, supplier) => (
              <div className="contact-info">
                {supplier.email && (
                  <div className="contact-item">
                    <Mail size={14} />
                    {supplier.email}
                  </div>
                )}
                {supplier.phone && (
                  <div className="contact-item">
                    <Phone size={14} />
                    {supplier.phone}
                  </div>
                )}
                {!supplier.email && !supplier.phone && <span className="no-contact">{t('suppliers.messages.notSet')}</span>}
              </div>
            )
          },
          {
            key: 'location',
            label: t('suppliers.table.location'),
            render: (_, supplier) => (
              supplier.city || supplier.country ? (
                <div className="location-info">
                  <MapPin size={14} />
                  {[supplier.city, supplier.country].filter(Boolean).join(', ')}
                </div>
              ) : (
                <span>{t('suppliers.messages.notSet')}</span>
              )
            )
          },
          {
            key: 'totalAcquisitions',
            label: t('suppliers.table.totalAcquisitions'),
            render: (_, supplier) => supplier.totalAcquisitions
          },
          {
            key: 'totalValue',
            label: t('suppliers.table.totalValue'),
            render: (_, supplier) => <span className="currency-cell">{formatCurrency(supplier.totalAcquisitionValue)}</span>
          },
          {
            key: 'status',
            label: t('suppliers.table.status'),
            render: (_, supplier) => (
              <span className={`status-badge ${supplier.isActive ? 'status-active' : 'status-inactive'}`}>
                {supplier.isActive ? t('suppliers.status.active') : t('suppliers.status.inactive')}
              </span>
            )
          },
          {
            key: 'createdAt',
            label: t('suppliers.table.createdAt'),
            render: (_, supplier) => formatDate(supplier.createdAt)
          },
          {
            key: 'actions',
            label: t('suppliers.table.actions'),
            render: (_, supplier) => (
              <div className="action-buttons">
                <ViewButton
                  requiredPermission={Permissions.ViewSupplier}
                  title={t('suppliers.tooltips.viewSupplier')}
                  onClick={() => handleViewSupplier(supplier)}
                />
                <EditButton
                  requiredPermission={Permissions.EditSupplier}
                  title={t('suppliers.tooltips.editSupplier')}
                  onClick={() => handleEditSupplier(supplier)}
                />
                {supplier.isActive && (
                  <DeleteButton
                    requiredPermission={Permissions.DeleteSupplier}
                    title={t('suppliers.tooltips.deactivateSupplier')}
                    onClick={() => handleDeleteSupplier(supplier)}
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
            data={suppliers}
            getRowClassName={(supplier) => !supplier.isActive ? 'inactive-row' : ''}
            emptyMessage={searchTerm || showInactive
              ? t('suppliers.empty.noSuppliersFound')
              : t('suppliers.empty.noSuppliersCreateFirst')}
          />
        );
      })()}

      {/* Pagination Controls */}
      {pagedData && pagedData.totalPages > 0 && (
        <div className="pagination-container">
          <div className="pagination-info">
            {t('suppliers.pagination.showing', {
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
              {t('suppliers.pagination.first')}
            </button>
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={!pagedData.hasPreviousPage}
            >
              <ChevronLeft size={16} />
              {t('suppliers.pagination.previous')}
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
              {t('suppliers.pagination.next')}
              <ChevronRight size={16} />
            </button>
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(pagedData.totalPages)}
              disabled={!pagedData.hasNextPage}
            >
              {t('suppliers.pagination.last')}
            </button>
          </div>
          
          <div className="page-size-selector">
            <label>{t('suppliers.pagination.show')}</label>
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
            <span>{t('suppliers.pagination.perPage')}</span>
          </div>
        </div>
      )}

      {/* Summary */}
      {pagedData && (
        <div className="suppliers-summary">
          <div className="summary-item">
            <strong>{t('suppliers.summary.totalSuppliers')}</strong> {pagedData.totalCount}
          </div>
          <div className="summary-item">
            <strong>{t('suppliers.summary.active')}</strong> {suppliers.filter(s => s.isActive).length} {t('suppliers.summary.of')} {pagedData.totalCount}
          </div>
          <div className="summary-item">
            <strong>{t('suppliers.summary.inactive')}</strong> {suppliers.filter(s => !s.isActive).length} {t('suppliers.summary.of')} {pagedData.totalCount}
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateSupplier
          onClose={() => setShowCreateModal(false)}
          onSupplierCreated={handleSupplierCreated}
        />
      )}

      {showViewModal && selectedSupplier && (
        <ViewSupplier
          isOpen={showViewModal}
          onClose={handleCloseViewModal}
          supplier={selectedSupplier}
        />
      )}

      {showEditModal && selectedSupplier && (
        <EditSupplier
          isOpen={showEditModal}
          onClose={handleCloseEditModal}
          onSuccess={handleSupplierUpdated}
          supplier={selectedSupplier}
        />
      )}
    </div>
  );
};

export default Suppliers;

