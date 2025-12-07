import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Building2, 
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import { supplierApi } from '../../services/api';
import type { Supplier, PagedResult } from '../../types';
import CreateSupplier from './CreateSupplier';
import EditSupplier from './EditSupplier';
import ViewSupplier from './ViewSupplier';
import DeleteSupplier from './DeleteSupplier';
import { Permissions } from '../../hooks/usePermissions';
import EditButton from '../atoms/EditButton';
import ViewButton from '../atoms/ViewButton';
import DeleteButton from '../atoms/DeleteButton';
import CreateButton from '../atoms/CreateButton';
import { Table, PageContainer, PageHeader, Loader, Checkbox, Pagination, Summary, ErrorMessage, FiltersControl } from '../atoms';
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
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

  const handleDeleteSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedSupplier) return;

    try {
      setIsDeleting(true);
      await supplierApi.deleteSupplier(selectedSupplier.id);
      setShowDeleteModal(false);
      setSelectedSupplier(null);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || t('suppliers.messages.failedToDeactivateSupplier'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseDeleteModal = () => {
    if (!isDeleting) {
      setShowDeleteModal(false);
      setSelectedSupplier(null);
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

  const suppliers = pagedData?.items || [];

  return (
    <PageContainer>
      <PageHeader
        title={t('suppliers.title')}
        icon={Building2}
        actions={
          <CreateButton
            onClick={handleCreateSupplier}
            requiredPermission={Permissions.CreateSupplier}
            variant="primary"
          >
            {t('suppliers.buttons.createNewSupplier')}
          </CreateButton>
        }
      />

      {/* Search and Filter */}
      <FiltersControl
        searchPlaceholder={t('suppliers.search.placeholder')}
        searchValue={searchTerm}
        onSearchChange={(e) => setSearchTerm(e.target.value)}
        filters={
          <Checkbox
            label={t('suppliers.filters.showInactive')}
            checked={showInactive}
            onChange={(e) => {
              setShowInactive(e.target.checked);
              setCurrentPage(1); // Reset to first page on filter change
            }}
          />
        }
      />

      {error && (
        <ErrorMessage
          message={error}
          onDismiss={() => setError(null)}
        />
      )}

      {/* Suppliers Table */}
      {(() => {
        if (isLoading) {
          return <Loader message={t('suppliers.loading.loadingSuppliers')} />;
        }

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

      {isLoading && (
        <Loader message={t('suppliers.loading.loadingSuppliers')} />
      )}

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
            showing: t('suppliers.pagination.showing', {
              start: ((pagedData.page - 1) * pagedData.pageSize) + 1,
              end: Math.min(pagedData.page * pagedData.pageSize, pagedData.totalCount),
              total: pagedData.totalCount
            }),
            first: t('suppliers.pagination.first'),
            previous: t('suppliers.pagination.previous'),
            next: t('suppliers.pagination.next'),
            last: t('suppliers.pagination.last'),
            show: t('suppliers.pagination.show'),
            perPage: t('suppliers.pagination.perPage')
          }}
        />
      )}

      {/* Summary */}
      {pagedData && (
        <Summary
          items={[
            {
              label: t('suppliers.summary.totalSuppliers'),
              value: pagedData.totalCount
            },
            {
              label: t('suppliers.summary.active'),
              value: `${suppliers.filter(s => s.isActive).length} ${t('suppliers.summary.of')} ${pagedData.totalCount}`
            },
            {
              label: t('suppliers.summary.inactive'),
              value: `${suppliers.filter(s => !s.isActive).length} ${t('suppliers.summary.of')} ${pagedData.totalCount}`
            }
          ]}
        />
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateSupplier
          isOpen={showCreateModal}
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

      {showDeleteModal && selectedSupplier && (
        <DeleteSupplier
          isOpen={showDeleteModal}
          onClose={handleCloseDeleteModal}
          onConfirm={handleConfirmDelete}
          supplier={selectedSupplier}
          isDeleting={isDeleting}
        />
      )}
    </PageContainer>
  );
};

export default Suppliers;

