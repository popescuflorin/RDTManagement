import React, { useState, useEffect } from 'react';
import { 
  Package, 
  AlertTriangle, 
  DollarSign, 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  Loader2
} from 'lucide-react';
import { inventoryApi } from '../services/api';
import type { RawMaterial, InventoryStatistics } from '../types';
import AddMaterial from './AddMaterial';
import EditMaterial from './EditMaterial';
import DeleteMaterialConfirmation from './DeleteMaterialConfirmation';
import './Inventory.css';

const Inventory: React.FC = () => {
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [statistics, setStatistics] = useState<InventoryStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<RawMaterial | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'low-stock' | 'active'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'quantity' | 'value' | 'updated'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [materialsResponse, statisticsResponse] = await Promise.all([
        inventoryApi.getAllMaterials(),
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

  const handleMaterialDeleted = (materialId: number) => {
    setMaterials(prevMaterials => prevMaterials.filter(material => material.id !== materialId));
    setShowDeleteModal(false);
    setSelectedMaterial(null);
    loadData(); // Refresh statistics
  };

  const closeModals = () => {
    setShowEditModal(false);
    setShowDeleteModal(false);
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

      // Category filter
      let categoryMatch = true;
      if (filterBy === 'low-stock') {
        categoryMatch = material.isLowStock;
      } else if (filterBy === 'active') {
        categoryMatch = material.isActive;
      }

      return searchMatch && categoryMatch;
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
        case 'value':
          comparison = a.totalValue - b.totalValue;
          break;
        case 'updated':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

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
          className="add-material-button"
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
          <div className="stat-card">
            <div className="stat-icon">
              <DollarSign size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{formatCurrency(statistics.totalInventoryValue)}</div>
              <div className="stat-label">Total Value</div>
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
            onChange={(e) => setFilterBy(e.target.value as typeof filterBy)}
            className="filter-select"
          >
            <option value="all">All Materials</option>
            <option value="active">Active Only</option>
            <option value="low-stock">Low Stock</option>
          </select>
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
              <th>Unit Cost</th>
              <th 
                className={`sortable ${sortBy === 'value' ? `sorted-${sortOrder}` : ''}`}
                onClick={() => handleSort('value')}
              >
                Total Value
              </th>
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
                <td colSpan={9} className="no-materials">
                  {searchTerm || filterBy !== 'all' 
                    ? 'No materials found matching your criteria.' 
                    : 'No materials in inventory. Add some materials to get started.'}
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
                  <td>{formatCurrency(material.unitCost)}</td>
                  <td className="value-cell">{formatCurrency(material.totalValue)}</td>
                  <td className="status-cell">
                    <span className={`status-badge ${material.isActive ? 'status-active' : 'status-inactive'}`}>
                      {material.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{formatDate(material.updatedAt)}</td>
                  <td className="actions-cell">
                    <div className="action-buttons">
                      <button 
                        className="action-button edit-button" 
                        title="Edit Material"
                        onClick={() => handleEditMaterial(material)}
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        className="action-button delete-button" 
                        title="Delete Material"
                        onClick={() => handleDeleteMaterial(material)}
                      >
                        <Trash2 size={16} />
                      </button>
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
    </div>
  );
};

export default Inventory;
