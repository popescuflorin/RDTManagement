import React, { useState, useEffect } from 'react';
import { 
  Building2, 
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
import { supplierApi } from '../../services/api';
import type { Supplier, PagedResult } from '../../types';
import CreateSupplier from './CreateSupplier';
import EditSupplier from './EditSupplier';
import ViewSupplier from './ViewSupplier';
import ProtectedButton from '../ProtectedButton';
import { Permissions } from '../../hooks/usePermissions';
import './Suppliers.css';

const Suppliers: React.FC = () => {
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
      setError(err.response?.data?.message || 'Failed to load suppliers');
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
    if (!window.confirm(`Are you sure you want to deactivate supplier "${supplier.name}"?`)) {
      return;
    }

    try {
      setIsDeleting(true);
      await supplierApi.deleteSupplier(supplier.id);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to deactivate supplier');
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
        <p>Loading suppliers...</p>
      </div>
    );
  }

  return (
    <div className="suppliers-container">
      <div className="suppliers-header">
        <h1>
          <Building2 size={24} style={{ marginRight: '12px', verticalAlign: 'middle' }} />
          Suppliers
        </h1>
        <ProtectedButton
          requiredPermission={Permissions.CreateSupplier}
          className="btn btn-primary"
          onClick={handleCreateSupplier}
        >
          <Plus size={16} />
          Create New Supplier
        </ProtectedButton>
      </div>

      {/* Search and Filter */}
      <div className="suppliers-controls">
        <div className="search-container">
          <div className="search-input-wrapper">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Search by name, description, contact, email, phone, city, country, tax ID, or registration number..."
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

      {/* Suppliers Table */}
      <div className="table-container">
        <table className="suppliers-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Contact</th>
              <th>Location</th>
              <th>Total Acquisitions</th>
              <th>Total Value</th>
              <th>Status</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.length === 0 ? (
              <tr>
                <td colSpan={9} className="no-data">
                  {searchTerm || showInactive
                    ? 'No suppliers found matching your criteria' 
                    : 'No suppliers found. Create your first supplier!'}
                </td>
              </tr>
            ) : (
              suppliers.map(supplier => (
                <tr key={supplier.id} className={!supplier.isActive ? 'inactive-row' : ''}>
                  <td>#{supplier.id}</td>
                  <td className="supplier-name">
                    <div>{supplier.name}</div>
                    {supplier.description && (
                      <div className="supplier-description">{supplier.description}</div>
                    )}
                    {supplier.contactPerson && (
                      <div className="supplier-contact-person">{supplier.contactPerson}</div>
                    )}
                  </td>
                  <td>
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
                      {!supplier.email && !supplier.phone && <span className="no-contact">—</span>}
                    </div>
                  </td>
                  <td>
                    {supplier.city || supplier.country ? (
                      <div className="location-info">
                        <MapPin size={14} />
                        {[supplier.city, supplier.country].filter(Boolean).join(', ')}
                      </div>
                    ) : (
                      <span>—</span>
                    )}
                  </td>
                  <td>{supplier.totalAcquisitions}</td>
                  <td className="currency-cell">{formatCurrency(supplier.totalAcquisitionValue)}</td>
                  <td>
                    <span className={`status-badge ${supplier.isActive ? 'status-active' : 'status-inactive'}`}>
                      {supplier.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{formatDate(supplier.createdAt)}</td>
                  <td className="actions-cell">
                    <div className="action-buttons">
                      <ProtectedButton
                        requiredPermission={Permissions.ViewSupplier}
                        className="btn btn-sm btn-primary"
                        title="View Supplier"
                        onClick={() => handleViewSupplier(supplier)}
                      >
                        <Eye size={16} />
                      </ProtectedButton>
                      <ProtectedButton
                        requiredPermission={Permissions.EditSupplier}
                        className="btn btn-sm btn-primary"
                        title="Edit Supplier"
                        onClick={() => handleEditSupplier(supplier)}
                      >
                        <Edit size={16} />
                      </ProtectedButton>
                      {supplier.isActive && (
                        <ProtectedButton
                          requiredPermission={Permissions.DeleteSupplier}
                          className="btn btn-sm btn-danger"
                          title="Deactivate Supplier"
                          onClick={() => handleDeleteSupplier(supplier)}
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
            Showing {((pagedData.page - 1) * pagedData.pageSize) + 1} to {Math.min(pagedData.page * pagedData.pageSize, pagedData.totalCount)} of {pagedData.totalCount} suppliers
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
        <div className="suppliers-summary">
          <div className="summary-item">
            <strong>Total Suppliers:</strong> {pagedData.totalCount}
          </div>
          <div className="summary-item">
            <strong>Active:</strong> {suppliers.filter(s => s.isActive).length} of {pagedData.totalCount}
          </div>
          <div className="summary-item">
            <strong>Inactive:</strong> {suppliers.filter(s => !s.isActive).length} of {pagedData.totalCount}
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

