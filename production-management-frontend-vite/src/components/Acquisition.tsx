import React, { useState, useEffect } from 'react';
import { acquisitionApi } from '../services/api';
import type { Acquisition, AcquisitionStatistics } from '../types';
import { AcquisitionStatus, AcquisitionType } from '../types';
import { Plus, Edit, Trash2, Package, Search, Filter } from 'lucide-react';
import CreateAcquisition from './CreateAcquisition';
import './Acquisition.css';

const Acquisition: React.FC = () => {
  const [acquisitions, setAcquisitions] = useState<Acquisition[]>([]);
  const [statistics, setStatistics] = useState<AcquisitionStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<AcquisitionStatus | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedAcquisition, setSelectedAcquisition] = useState<Acquisition | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [acquisitionsResponse, statsResponse] = await Promise.all([
        acquisitionApi.getAllAcquisitions(),
        acquisitionApi.getStatistics()
      ]);
      
      setAcquisitions(acquisitionsResponse.data);
      setStatistics(statsResponse.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load acquisition data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAcquisition = () => {
    setSelectedAcquisition(null);
    setShowCreateModal(true);
  };

  const handleEditAcquisition = (acquisition: Acquisition) => {
    setSelectedAcquisition(acquisition);
    setShowEditModal(true);
  };

  const handleDeleteAcquisition = (acquisition: Acquisition) => {
    setSelectedAcquisition(acquisition);
    setShowDeleteModal(true);
  };

  const handleReceiveAcquisition = (acquisition: Acquisition) => {
    setSelectedAcquisition(acquisition);
    setShowReceiveModal(true);
  };

  const handleDelete = async () => {
    if (!selectedAcquisition) return;

    try {
      await acquisitionApi.deleteAcquisition(selectedAcquisition.id);
      await loadData();
      setShowDeleteModal(false);
      setSelectedAcquisition(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete acquisition');
    }
  };

  const getStatusBadge = (status: AcquisitionStatus) => {
    const statusConfig = {
      [AcquisitionStatus.Draft]: { label: 'Draft', className: 'status-draft' },
      [AcquisitionStatus.Received]: { label: 'Received', className: 'status-received' },
      [AcquisitionStatus.Cancelled]: { label: 'Cancelled', className: 'status-cancelled' }
    };

    const config = statusConfig[status];
    return <span className={`status-badge ${config.className}`}>{config.label}</span>;
  };

  const getTypeLabel = (type: AcquisitionType) => {
    const typeLabels = {
      [AcquisitionType.RawMaterials]: 'Raw Materials',
      [AcquisitionType.RecyclableMaterials]: 'Recyclable Materials'
    };
    return typeLabels[type];
  };

  // Function to determine due date status
  const getDueDateStatus = (acquisition: Acquisition): 'green' | 'yellow' | 'red' | 'completed' => {
    // If acquisition is completed/received, show green
    if (acquisition.status === AcquisitionStatus.Received) {
      return 'completed';
    }
    
    // If no due date, show green (no urgency)
    if (!acquisition.dueDate) {
      return 'green';
    }
    
    const dueDate = new Date(acquisition.dueDate);
    const today = new Date();
    const timeDiff = dueDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    // If due date has passed, show red
    if (daysDiff < 0) {
      return 'red';
    }
    
    // If due date is less than 5 days, show yellow
    if (daysDiff <= 5) {
      return 'yellow';
    }
    
    // If due date is more than 5 days, show green
    return 'green';
  };

  const filteredAcquisitions = acquisitions
    .filter(acquisition => {
      const matchesSearch = acquisition.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           acquisition.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           acquisition.supplierName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || acquisition.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      // Sort by due date ascending (null dates at the end)
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      
      const dateA = new Date(a.dueDate);
      const dateB = new Date(b.dueDate);
      return dateA.getTime() - dateB.getTime();
    });

  if (isLoading) {
    return (
      <div className="acquisition-loading">
        <div className="loading-spinner"></div>
        <p>Loading acquisitions...</p>
      </div>
    );
  }

  return (
    <div className="acquisition-container">
      {/* Header */}
      <div className="acquisition-header">
        <div className="header-left">
          <h1>Acquisitions</h1>
          <p>Manage raw material orders and acquisitions</p>
        </div>
        <button 
          className="add-acquisition-button"
          onClick={handleCreateAcquisition}
        >
          <Plus size={20} />
          Create Acquisition
        </button>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="acquisition-statistics">
          <div className="stat-card">
            <div className="stat-icon">
              <Package size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{statistics.totalAcquisitions}</div>
              <div className="stat-label">Total Acquisitions</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Edit size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{statistics.draftAcquisitions}</div>
              <div className="stat-label">Draft</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Package size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{statistics.receivedAcquisitions}</div>
              <div className="stat-label">Received</div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Controls */}
      <div className="acquisition-controls">
        <div className="search-container">
          <div className="search-input-wrapper">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Search acquisitions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
        <div className="filter-container">
          <Filter size={20} className="filter-icon" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as AcquisitionStatus | 'all')}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value={AcquisitionStatus.Draft}>Draft</option>
            <option value={AcquisitionStatus.Received}>Received</option>
            <option value={AcquisitionStatus.Cancelled}>Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="acquisitions-table">
          <thead>
            <tr>
              <th className="status-bar-column"></th>
              <th>Title</th>
              <th>Type</th>
              <th>Status</th>
              <th>Supplier</th>
              <th>Items</th>
              <th>Due Date</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAcquisitions.length === 0 ? (
              <tr>
                <td colSpan={9} className="empty-state">
                  <div className="empty-content">
                    <Package size={48} />
                    <h3>No acquisitions found</h3>
                    <p>Create your first acquisition to get started</p>
                    <button 
                      className="empty-add-button"
                      onClick={handleCreateAcquisition}
                    >
                      <Plus size={20} />
                      Create Acquisition
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredAcquisitions.map((acquisition) => (
                <tr key={acquisition.id}>
                  <td className="status-bar-cell">
                    <div className={`status-bar status-${getDueDateStatus(acquisition)}`}></div>
                  </td>
                  <td>
                    <div className="acquisition-title">
                      <div className="title">{acquisition.title}</div>
                      {acquisition.description && (
                        <div className="description">{acquisition.description}</div>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="type-badge">
                      {getTypeLabel(acquisition.type)}
                    </span>
                  </td>
                  <td>{getStatusBadge(acquisition.status)}</td>
                  <td>
                    <div className="supplier-info">
                      <div className="supplier-name">{acquisition.supplierName || '-'}</div>
                      {acquisition.supplierContact && (
                        <div className="supplier-contact">{acquisition.supplierContact}</div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="items-info">
                      <div className="items-count">{acquisition.totalItems} items</div>
                      <div className="total-quantity">{acquisition.totalQuantity} units</div>
                    </div>
                  </td>
                  <td>
                    <div className="due-date-info">
                      {acquisition.dueDate ? (
                        <div className="due-date">
                          {new Date(acquisition.dueDate).toLocaleDateString()}
                        </div>
                      ) : (
                        <div className="no-due-date">-</div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="date-info">
                      <div className="created-date">
                        {new Date(acquisition.createdAt).toLocaleDateString()}
                      </div>
                      <div className="created-by">
                        by {acquisition.createdByUserName}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {acquisition.canEdit && (
                        <button
                          className="action-button edit-button"
                          onClick={() => handleEditAcquisition(acquisition)}
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                      )}
                      {acquisition.canReceive && (
                        <button
                          className="action-button receive-button"
                          onClick={() => handleReceiveAcquisition(acquisition)}
                          title="Receive"
                        >
                          <Package size={16} />
                        </button>
                      )}
                      {acquisition.canDelete && (
                        <button
                          className="action-button delete-button"
                          onClick={() => handleDeleteAcquisition(acquisition)}
                          title="Delete"
                        >
                          <Trash2 size={16} />
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
      <CreateAcquisition
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadData}
      />

      {showEditModal && selectedAcquisition && (
        <div className="modal-backdrop" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {/* Edit Acquisition Modal - Will be implemented */}
            <h2>Edit Acquisition</h2>
            <p>Editing: {selectedAcquisition.title}</p>
            <p>Modal content will be implemented in the next step</p>
            <button onClick={() => setShowEditModal(false)}>Close</button>
          </div>
        </div>
      )}

      {showDeleteModal && selectedAcquisition && (
        <div className="modal-backdrop" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Delete Acquisition</h2>
            <p>Are you sure you want to delete "{selectedAcquisition.title}"?</p>
            <p className="warning-text">This action cannot be undone.</p>
            <div className="modal-actions">
              <button 
                className="cancel-button"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button 
                className="delete-button"
                onClick={handleDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showReceiveModal && selectedAcquisition && (
        <div className="modal-backdrop" onClick={() => setShowReceiveModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {/* Receive Acquisition Modal - Will be implemented */}
            <h2>Receive Acquisition</h2>
            <p>Receiving: {selectedAcquisition.title}</p>
            <p>Modal content will be implemented in the next step</p>
            <button onClick={() => setShowReceiveModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Acquisition;
