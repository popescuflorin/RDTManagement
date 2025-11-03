import React, { useState, useEffect } from 'react';
import { 
  Package, 
  AlertTriangle, 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  CheckCircle,
  Eye,
  Loader2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { inventoryApi } from '../../services/api';
import type { RawMaterial, InventoryStatistics, PagedResult } from '../../types';
import { MaterialType } from '../../types';
import AddMaterial from './AddMaterial';
import EditMaterial from './EditMaterial';
import ViewMaterial from './ViewMaterial';
import DeleteMaterialConfirmation from './DeleteMaterialConfirmation';
import ActivateMaterialModal from './ActivateMaterialModal';
import ProtectedButton from '../ProtectedButton';
import { Permissions } from '../../hooks/usePermissions';
import './Inventory.css';

const Inventory: React.FC = () => {
  const [pagedData, setPagedData] = useState<PagedResult<RawMaterial> | null>(null);
  const [statistics, setStatistics] = useState<InventoryStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination and filtering state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState<MaterialType>(MaterialType.RawMaterial);
  const [showInactive, setShowInactive] = useState(false);
  const [sortBy, setSortBy] = useState<string>('Name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<RawMaterial | null>(null);

  useEffect(() => {
    loadData();
  }, [currentPage, pageSize, searchTerm, filterBy, showInactive, sortBy, sortOrder]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [pagedResponse, statsResponse] = await Promise.all([
        inventoryApi.getMaterialsPaged({
          page: currentPage,
          pageSize: pageSize,
          searchTerm: searchTerm || undefined,
          type: filterBy,
          isActive: showInactive ? false : true,
          sortBy: sortBy,
          sortOrder: sortOrder
        }),
        inventoryApi.getStatistics()
      ]);
      
      setPagedData(pagedResponse.data);
      setStatistics(statsResponse.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load inventory data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMaterialCreated = () => {
    setShowAddModal(false);
    loadData(); // Reload data
  };

  const handleViewMaterial = (material: RawMaterial) => {
    setSelectedMaterial(material);
    setShowViewModal(true);
  };

  const handleEditMaterial = (material: RawMaterial) => {
    setSelectedMaterial(material);
    setShowEditModal(true);
  };

  const handleMaterialUpdated = () => {
    setShowEditModal(false);
    setSelectedMaterial(null);
    loadData(); // Reload data
  };

  const handleDeleteMaterial = (material: RawMaterial) => {
    setSelectedMaterial(material);
    setShowDeleteModal(true);
  };

  const handleActivateMaterial = (material: RawMaterial) => {
    setSelectedMaterial(material);
    setShowActivateModal(true);
  };

  const handleMaterialDeleted = () => {
    setShowDeleteModal(false);
    setSelectedMaterial(null);
    loadData(); // Reload data
  };

  const handleMaterialActivated = () => {
    setShowActivateModal(false);
    setSelectedMaterial(null);
    loadData(); // Reload data
  };

  const closeModals = () => {
    setShowViewModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setShowActivateModal(false);
    setSelectedMaterial(null);
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      // Toggle sort order if clicking the same column
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to ascending
      setSortBy(column);
      setSortOrder('asc');
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

  const materials = pagedData?.items || [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="inventory-loading">
        <Loader2 size={32} className="animate-spin" />
        <p>Loading inventory...</p>
      </div>
    );
  }

  return (
    <div className="inventory-container">
      <div className="inventory-header">
        <h1>
          <Package size={24} style={{ marginRight: '12px', verticalAlign: 'middle' }} />
          Inventory Management
        </h1>
        <ProtectedButton
          requiredPermission={Permissions.AddMaterial}
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={16} />
          Add Material
        </ProtectedButton>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="inventory-stats">
          <div className="stat-card">
            <div className="stat-icon">
              <Package size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{statistics.totalMaterials}</div>
              <div className="stat-label">Total Materials</div>
            </div>
          </div>
          <div className={`stat-card ${statistics.lowStockCount > 0 ? 'warning' : ''}`}>
            <div className="stat-icon">
              <AlertTriangle size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{statistics.lowStockCount}</div>
              <div className="stat-label">Low Stock</div>
            </div>
          </div>
          <div className={`stat-card ${statistics.insufficientStockCount > 0 ? 'error' : ''}`}>
            <div className="stat-icon">
              <XCircle size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{statistics.insufficientStockCount}</div>
              <div className="stat-label">Insufficient Stock</div>
              <div className="stat-description">Pending requests exceed available quantity</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="inventory-controls">
        <div className="search-container">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search materials..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
            className="search-input"
          />
        </div>
        
        {/* Type Filter Buttons */}
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filterBy === MaterialType.RawMaterial ? 'active' : ''}`}
            onClick={() => {
              setFilterBy(MaterialType.RawMaterial);
              setCurrentPage(1);
            }}
          >
            Raw Materials
          </button>
          <button
            className={`filter-btn ${filterBy === MaterialType.RecyclableMaterial ? 'active' : ''}`}
            onClick={() => {
              setFilterBy(MaterialType.RecyclableMaterial);
              setCurrentPage(1);
            }}
          >
            Recyclable Materials
          </button>
          <button
            className={`filter-btn ${filterBy === MaterialType.FinishedProduct ? 'active' : ''}`}
            onClick={() => {
              setFilterBy(MaterialType.FinishedProduct);
              setCurrentPage(1);
            }}
          >
            Finished Products
          </button>
        </div>
        
        <div className="checkbox-filter">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => {
                setShowInactive(e.target.checked);
                setCurrentPage(1);
              }}
            />
            <span>Show Inactive Materials</span>
          </label>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Materials Table */}
      <div className="table-container">
        <table className="inventory-materials-table">
          <thead>
            <tr>
              <th className="sortable" onClick={() => handleSort('Name')}>
                <div className="th-content">
                  <span>Material</span>
                  {getSortIcon('Name')}
                </div>
              </th>
              <th>Color</th>
              <th className="sortable" onClick={() => handleSort('Quantity')}>
                <div className="th-content">
                  <span>In Stock</span>
                  {getSortIcon('Quantity')}
                </div>
              </th>
              <th>Requested</th>
              <th>Available</th>
              <th>Min. Stock</th>
              <th>Status</th>
              <th className="sortable" onClick={() => handleSort('Updated')}>
                <div className="th-content">
                  <span>Last Updated</span>
                  {getSortIcon('Updated')}
                </div>
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {materials.length === 0 ? (
              <tr>
                <td colSpan={10} className="no-materials">
                  {searchTerm 
                    ? 'No materials found matching your criteria.' 
                    : 'No materials in this category. Add some materials to get started.'}
                </td>
              </tr>
            ) : (
              materials.map((material) => {
                const availableQuantity = material.quantity - material.requestedQuantity;
                const isInsufficient = availableQuantity < 0;
                
                return (
                <tr key={material.id} className={!material.isActive ? 'inactive-material' : ''}>
                  <td className="material-name-cell">
                    <div className="material-name">{material.name}</div>
                    {material.description && (
                      <div className="material-description">{material.description}</div>
                    )}
                  </td>
                  <td>
                    <div className="color-indicator">
                      <span 
                        className="color-dot" 
                        style={{ backgroundColor: material.color.toLowerCase() }}
                      ></span>
                      {material.color}
                    </div>
                  </td>
                  <td className="quantity-cell">
                    <div className="quantity-value">
                      {material.quantity.toLocaleString()} {material.quantityType}
                    </div>
                  </td>
                  <td className="quantity-cell">
                    <div className="quantity-value" style={{ color: material.requestedQuantity > 0 ? '#ff9800' : '#666' }}>
                      {material.requestedQuantity.toLocaleString()} {material.quantityType}
                    </div>
                  </td>
                  <td className="quantity-cell">
                    <div className="quantity-value" style={{ 
                      color: isInsufficient ? '#f44336' : (availableQuantity <= material.minimumStock ? '#ff9800' : '#4caf50'),
                      fontWeight: isInsufficient ? 'bold' : 'normal'
                    }}>
                      {availableQuantity.toLocaleString()} {material.quantityType}
                    </div>
                    {material.isLowStock && (
                      <div className="low-stock-indicator">
                        {isInsufficient ? 'Insufficient!' : 'Low Stock!'}
                      </div>
                    )}
                  </td>
                  <td>{material.minimumStock.toLocaleString()} {material.quantityType}</td>
                  <td className="status-cell">
                    <span className={`status-badge ${material.isActive ? 'status-active' : 'status-inactive'}`}>
                      {material.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{formatDate(material.updatedAt)}</td>
                  <td className="actions-cell">
                    <div className="action-buttons">
                      <ProtectedButton
                        requiredPermission={Permissions.ViewMaterial}
                        className="btn btn-sm btn-info" 
                        title="View Material"
                        onClick={() => handleViewMaterial(material)}
                      >
                        <Eye size={16} />
                      </ProtectedButton>
                      <ProtectedButton
                        requiredPermission={Permissions.EditMaterial}
                        className="btn btn-sm btn-warning" 
                        title="Edit Material"
                        onClick={() => handleEditMaterial(material)}
                      >
                        <Edit size={16} />
                      </ProtectedButton>
                      {material.isActive ? (
                        <ProtectedButton
                          requiredPermission={Permissions.DeactivateMaterial}
                          className="btn btn-sm btn-danger" 
                          title={material.quantity > 0 ? "Cannot deactivate - stock must be 0" : "Deactivate Material"}
                          onClick={() => handleDeleteMaterial(material)}
                          disabled={material.quantity > 0}
                        >
                          <Trash2 size={16} />
                        </ProtectedButton>
                      ) : (
                        <ProtectedButton
                          requiredPermission={Permissions.ActivateMaterial}
                          className="btn btn-sm btn-success" 
                          title="Activate Material"
                          onClick={() => handleActivateMaterial(material)}
                        >
                          <CheckCircle size={16} />
                        </ProtectedButton>
                      )}
                    </div>
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {pagedData && pagedData.totalPages > 0 && (
        <div className="pagination-container">
          <div className="pagination-info">
            Showing {((pagedData.page - 1) * pagedData.pageSize) + 1} to {Math.min(pagedData.page * pagedData.pageSize, pagedData.totalCount)} of {pagedData.totalCount} materials
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
      {showAddModal && (
        <AddMaterial
          onClose={() => setShowAddModal(false)}
          onMaterialCreated={handleMaterialCreated}
        />
      )}

      {showViewModal && selectedMaterial && (
        <ViewMaterial
          material={selectedMaterial}
          onClose={closeModals}
        />
      )}

      {showEditModal && selectedMaterial && (
        <EditMaterial
          material={selectedMaterial}
          onClose={closeModals}
          onMaterialUpdated={handleMaterialUpdated}
        />
      )}

      {showDeleteModal && selectedMaterial && (
        <DeleteMaterialConfirmation
          material={selectedMaterial}
          onClose={closeModals}
          onMaterialDeleted={handleMaterialDeleted}
        />
      )}

      {showActivateModal && selectedMaterial && (
        <ActivateMaterialModal
          material={selectedMaterial}
          onClose={closeModals}
          onMaterialActivated={handleMaterialActivated}
        />
      )}
    </div>
  );
};

export default Inventory;
