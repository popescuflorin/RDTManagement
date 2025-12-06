import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Package, 
  AlertTriangle, 
  Plus, 
  Search, 
  CheckCircle,
  Loader2,
  XCircle,
  ChevronLeft,
  ChevronRight
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
import EditButton from '../atoms/EditButton';
import ViewButton from '../atoms/ViewButton';
import DeleteButton from '../atoms/DeleteButton';
import { Table } from '../atoms';
import type { TableColumn } from '../atoms';
import './Inventory.css';

const Inventory: React.FC = () => {
  const { t } = useTranslation(['inventory', 'common']);
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
      setError(err.response?.data?.message || t('messages.failedToLoad'));
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

  const handleSort = (column: string, order: 'asc' | 'desc') => {
    setSortBy(column);
    setSortOrder(order);
    setCurrentPage(1); // Reset to first page when sorting changes
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
        <p>{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="inventory-container">
      <div className="inventory-header">
        <h1>
          <Package size={24} style={{ marginRight: '12px', verticalAlign: 'middle' }} />
          {t('inventoryManagement')}
        </h1>
        <ProtectedButton
          requiredPermission={Permissions.AddMaterial}
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={16} />
          {t('addMaterial')}
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
              <div className="stat-label">{t('statistics.totalMaterials')}</div>
            </div>
          </div>
          <div className={`stat-card ${statistics.lowStockCount > 0 ? 'warning' : ''}`}>
            <div className="stat-icon">
              <AlertTriangle size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{statistics.lowStockCount}</div>
              <div className="stat-label">{t('statistics.lowStock')}</div>
            </div>
          </div>
          <div className={`stat-card ${statistics.insufficientStockCount > 0 ? 'error' : ''}`}>
            <div className="stat-icon">
              <XCircle size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{statistics.insufficientStockCount}</div>
              <div className="stat-label">{t('statistics.insufficientStock')}</div>
              <div className="stat-description">{t('statistics.insufficientStockDescription')}</div>
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
            placeholder={t('searchPlaceholder')}
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
            {t('filters.rawMaterials')}
          </button>
          <button
            className={`filter-btn ${filterBy === MaterialType.RecyclableMaterial ? 'active' : ''}`}
            onClick={() => {
              setFilterBy(MaterialType.RecyclableMaterial);
              setCurrentPage(1);
            }}
          >
            {t('filters.recyclableMaterials')}
          </button>
          <button
            className={`filter-btn ${filterBy === MaterialType.FinishedProduct ? 'active' : ''}`}
            onClick={() => {
              setFilterBy(MaterialType.FinishedProduct);
              setCurrentPage(1);
            }}
          >
            {t('filters.finishedProducts')}
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
            <span>{t('showInactiveMaterials')}</span>
          </label>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Materials Table */}
      {(() => {
        const columns: TableColumn<RawMaterial>[] = [
          {
            key: 'Name',
            label: t('table.material'),
            sortable: true,
            render: (_, material) => (
              <div className="material-name-cell">
                <div className="material-name">{material.name}</div>
                {material.description && (
                  <div className="material-description">{material.description}</div>
                )}
              </div>
            ),
            cellClassName: 'material-name-cell'
          },
          {
            key: 'color',
            label: t('table.color'),
            render: (_, material) => (
              <div className="color-indicator">
                <span 
                  className="color-dot" 
                  style={{ backgroundColor: material.color.toLowerCase() }}
                ></span>
                {material.color}
              </div>
            )
          },
          {
            key: 'Quantity',
            label: t('table.inStock'),
            sortable: true,
            render: (_, material) => (
              <div className="quantity-cell">
                <div className="quantity-value">
                  {material.quantity.toLocaleString()} {material.quantityType}
                </div>
              </div>
            ),
            cellClassName: 'quantity-cell'
          },
          {
            key: 'requested',
            label: t('table.requested'),
            render: (_, material) => (
              <div className="quantity-cell">
                <div className="quantity-value" style={{ color: material.requestedQuantity > 0 ? '#ff9800' : '#666' }}>
                  {material.requestedQuantity.toLocaleString()} {material.quantityType}
                </div>
              </div>
            ),
            cellClassName: 'quantity-cell'
          },
          {
            key: 'available',
            label: t('table.available'),
            render: (_, material) => {
              const availableQuantity = material.quantity - material.requestedQuantity;
              const isInsufficient = availableQuantity < 0;
              return (
                <div className="quantity-cell">
                  <div className="quantity-value" style={{ 
                    color: isInsufficient ? '#f44336' : (availableQuantity <= material.minimumStock ? '#ff9800' : '#4caf50'),
                    fontWeight: isInsufficient ? 'bold' : 'normal'
                  }}>
                    {availableQuantity.toLocaleString()} {material.quantityType}
                  </div>
                  {material.isLowStock && (
                    <div className="low-stock-indicator">
                      {isInsufficient ? t('status.insufficient') : t('status.lowStock')}
                    </div>
                  )}
                </div>
              );
            },
            cellClassName: 'quantity-cell'
          },
          {
            key: 'minStock',
            label: t('table.minStock'),
            render: (_, material) => `${material.minimumStock.toLocaleString()} ${material.quantityType}`
          },
          {
            key: 'status',
            label: t('table.status'),
            render: (_, material) => (
              <span className={`status-badge ${material.isActive ? 'status-active' : 'status-inactive'}`}>
                {material.isActive ? t('status.active') : t('status.inactive')}
              </span>
            ),
            cellClassName: 'status-cell'
          },
          {
            key: 'Updated',
            label: t('table.lastUpdated'),
            sortable: true,
            render: (_, material) => formatDate(material.updatedAt)
          },
          {
            key: 'actions',
            label: t('table.actions'),
            render: (_, material) => (
              <div className="action-buttons">
                <ViewButton
                  requiredPermission={Permissions.ViewMaterial}
                  title={t('actions.view')}
                  onClick={() => handleViewMaterial(material)}
                />
                <EditButton
                  requiredPermission={Permissions.EditMaterial}
                  title={t('actions.edit')}
                  onClick={() => handleEditMaterial(material)}
                />
                {material.isActive ? (
                  <DeleteButton
                    requiredPermission={Permissions.DeactivateMaterial}
                    title={material.quantity > 0 ? t('actions.cannotDeactivate') : t('actions.deactivate')}
                    onClick={() => handleDeleteMaterial(material)}
                    disabled={material.quantity > 0}
                  />
                ) : (
                  <ProtectedButton
                    requiredPermission={Permissions.ActivateMaterial}
                    className="btn btn-sm btn-success" 
                    title={t('actions.activate')}
                    onClick={() => handleActivateMaterial(material)}
                  >
                    <CheckCircle size={16} />
                  </ProtectedButton>
                )}
              </div>
            ),
            cellClassName: 'actions-cell'
          }
        ];

        return (
          <Table
            columns={columns}
            data={materials}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            getRowClassName={(material) => !material.isActive ? 'inactive-material' : ''}
            emptyMessage={searchTerm 
              ? t('emptyState.noMaterialsFound')
              : t('emptyState.noMaterialsInCategory')}
          />
        );
      })()}

      {/* Pagination Controls */}
      {pagedData && pagedData.totalPages > 0 && (
        <div className="pagination-container">
          <div className="pagination-info">
            {t('pagination.showing', {
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
              {t('pagination.first')}
            </button>
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={!pagedData.hasPreviousPage}
            >
              <ChevronLeft size={16} />
              {t('pagination.previous')}
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
              {t('pagination.next')}
              <ChevronRight size={16} />
            </button>
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(pagedData.totalPages)}
              disabled={!pagedData.hasNextPage}
            >
              {t('pagination.last')}
            </button>
          </div>
          
          <div className="page-size-selector">
            <label>{t('pagination.show')}</label>
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
            <span>{t('pagination.perPage')}</span>
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
