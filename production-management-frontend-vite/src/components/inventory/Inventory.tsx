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
  Loader2
} from 'lucide-react';
import { inventoryApi } from '../../services/api';
import type { RawMaterial, InventoryStatistics } from '../../types';
import { MaterialType } from '../../types';
import AddMaterial from './AddMaterial';
import EditMaterial from './EditMaterial';
import ViewMaterial from './ViewMaterial';
import DeleteMaterialConfirmation from './DeleteMaterialConfirmation';
import ActivateMaterialModal from './ActivateMaterialModal';
import './Inventory.css';

const Inventory: React.FC = () => {
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [statistics, setStatistics] = useState<InventoryStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<RawMaterial | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState<MaterialType>(MaterialType.RawMaterial);
  const [showInactive, setShowInactive] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'quantity' | 'updated'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Get user role from localStorage
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  const isAdmin = user?.role === 'Admin';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [materialsResponse, statisticsResponse] = await Promise.all([
        inventoryApi.getAllMaterialsIncludingInactive(),
        inventoryApi.getStatistics()
      ]);
      setMaterials(materialsResponse.data);
      setStatistics(statisticsResponse.data);
    } catch (error: any) {
      console.error('Error loading inventory data:', error);
      setError('Failed to load inventory data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMaterialCreated = (newMaterial: RawMaterial) => {
    setMaterials(prevMaterials => [...prevMaterials, newMaterial]);
    setShowAddModal(false);
    loadData(); // Refresh statistics
  };

  const handleViewMaterial = (material: RawMaterial) => {
    setSelectedMaterial(material);
    setShowViewModal(true);
  };

  const handleEditMaterial = (material: RawMaterial) => {
    setSelectedMaterial(material);
    setShowEditModal(true);
  };

  const handleMaterialUpdated = (updatedMaterial: RawMaterial) => {
    setMaterials(prevMaterials => 
      prevMaterials.map(material => 
        material.id === updatedMaterial.id ? updatedMaterial : material
      )
    );
    setShowEditModal(false);
    setSelectedMaterial(null);
    loadData(); // Refresh statistics
  };

  const handleDeleteMaterial = (material: RawMaterial) => {
    setSelectedMaterial(material);
    setShowDeleteModal(true);
  };

  const handleActivateMaterial = (material: RawMaterial) => {
    setSelectedMaterial(material);
    setShowActivateModal(true);
  };

  const handleMaterialDeleted = (materialId: number) => {
    setMaterials(prevMaterials => prevMaterials.filter(material => material.id !== materialId));
    setShowDeleteModal(false);
    setSelectedMaterial(null);
    loadData(); // Refresh statistics
  };

  const handleMaterialActivated = (materialId: number) => {
    setMaterials(prevMaterials => 
      prevMaterials.map(material => 
        material.id === materialId ? { ...material, isActive: true } : material
      )
    );
    setShowActivateModal(false);
    setSelectedMaterial(null);
    loadData(); // Refresh statistics
  };

  const closeModals = () => {
    setShowViewModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setShowActivateModal(false);
    setSelectedMaterial(null);
  };

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const filteredAndSortedMaterials = materials
    .filter(material => {
      // Search filter
      const searchMatch = searchTerm === '' || 
        material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.color.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.quantityType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (material.description && material.description.toLowerCase().includes(searchTerm.toLowerCase()));

      // Material type filter
      const typeMatch = material.type === filterBy;

      // Active/Inactive filter
      const activeMatch = showInactive ? !material.isActive : material.isActive;

      return searchMatch && typeMatch && activeMatch;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name) || a.color.localeCompare(b.color);
          break;
        case 'quantity':
          comparison = a.quantity - b.quantity;
          break;
        case 'updated':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

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
        <button 
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={16} />
          Add Material
        </button>
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
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-container">
          <select 
            value={filterBy} 
            onChange={(e) => setFilterBy(Number(e.target.value) as MaterialType)}
            className="filter-select"
          >
            <option value={MaterialType.RawMaterial}>Raw Materials</option>
            <option value={MaterialType.RecyclableMaterial}>Recyclable Materials</option>
            <option value={MaterialType.FinishedProduct}>Finished Products</option>
          </select>
        </div>
        <div className="checkbox-filter">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
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
        <table className="materials-table">
          <thead>
            <tr>
              <th 
                className={`sortable ${sortBy === 'name' ? `sorted-${sortOrder}` : ''}`}
                onClick={() => handleSort('name')}
              >
                Material
              </th>
              <th>Color</th>
              <th 
                className={`sortable ${sortBy === 'quantity' ? `sorted-${sortOrder}` : ''}`}
                onClick={() => handleSort('quantity')}
              >
                Quantity
              </th>
              <th>Min. Stock</th>
              <th>Status</th>
              <th 
                className={`sortable ${sortBy === 'updated' ? `sorted-${sortOrder}` : ''}`}
                onClick={() => handleSort('updated')}
              >
                Last Updated
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedMaterials.length === 0 ? (
              <tr>
                <td colSpan={7} className="no-materials">
                  {searchTerm 
                    ? 'No materials found matching your criteria.' 
                    : 'No materials in this category. Add some materials to get started.'}
                </td>
              </tr>
            ) : (
              filteredAndSortedMaterials.map((material) => (
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
                    {material.isLowStock && (
                      <div className="low-stock-indicator">Low Stock!</div>
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
                      <button 
                        className="btn btn-sm btn-info" 
                        title="View Material"
                        onClick={() => handleViewMaterial(material)}
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        className="btn btn-sm btn-warning" 
                        title="Edit Material"
                        onClick={() => handleEditMaterial(material)}
                      >
                        <Edit size={16} />
                      </button>
                      {material.isActive ? (
                        isAdmin && (
                          <button 
                            className="btn btn-sm btn-danger" 
                            title={material.quantity > 0 ? "Cannot deactivate - stock must be 0" : "Deactivate Material"}
                            onClick={() => handleDeleteMaterial(material)}
                            disabled={material.quantity > 0}
                          >
                            <Trash2 size={16} />
                          </button>
                        )
                      ) : (
                        <button 
                          className="btn btn-sm btn-success" 
                          title="Activate Material"
                          onClick={() => handleActivateMaterial(material)}
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
