import React, { useState, useEffect } from 'react';
import { acquisitionApi, inventoryApi } from '../services/api';
import type { Acquisition, RawMaterial } from '../types';
import { AcquisitionType, MaterialType } from '../types';
import { X, Package, FileText, Truck, Building2, Plus, Trash2 } from 'lucide-react';
import './CreateAcquisition.css';

interface ProcessAcquisitionProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  acquisition: Acquisition;
}

interface RecyclableItem {
  id: number;
  rawMaterialId: number;
  name: string;
  color: string;
  quantity: number;
  unitOfMeasure: string;
}

interface ProcessedMaterial {
  id: string; // Temporary ID for UI
  recyclableItemId: number;
  rawMaterialId: number | null;
  name: string;
  color: string;
  description: string;
  quantity: number;
  unitOfMeasure: string;
  isNew: boolean;
}

const ProcessAcquisition: React.FC<ProcessAcquisitionProps> = ({
  isOpen,
  onClose,
  onSuccess,
  acquisition
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recyclableItems, setRecyclableItems] = useState<RecyclableItem[]>([]);
  const [processedMaterials, setProcessedMaterials] = useState<ProcessedMaterial[]>([]);
  const [availableRawMaterials, setAvailableRawMaterials] = useState<RawMaterial[]>([]);

  useEffect(() => {
    if (isOpen && acquisition) {
      loadData();
    }
  }, [isOpen, acquisition]);

  const loadData = async () => {
    try {
      // Load recyclable items from acquisition
      const items: RecyclableItem[] = acquisition.items.map(item => ({
        id: item.id,
        rawMaterialId: item.rawMaterialId,
        name: item.rawMaterialName,
        color: item.rawMaterialColor,
        quantity: item.quantity,
        unitOfMeasure: item.quantityType
      }));
      setRecyclableItems(items);

      // Load available raw materials (for dropdown)
      const rawMaterialsResponse = await inventoryApi.getAllMaterials();
      // Filter to show only raw materials (not recyclables)
      const rawMaterialsOnly = rawMaterialsResponse.data.filter(
        (material: RawMaterial) => material.type === MaterialType.RawMaterial
      );
      setAvailableRawMaterials(rawMaterialsOnly);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load data');
    }
  };

  const handleAddProcessedMaterial = (recyclableItem: RecyclableItem) => {
    const newMaterial: ProcessedMaterial = {
      id: `temp-${Date.now()}-${Math.random()}`,
      recyclableItemId: recyclableItem.id,
      rawMaterialId: null,
      name: '',
      color: '',
      description: '',
      quantity: 0,
      unitOfMeasure: recyclableItem.unitOfMeasure,
      isNew: true
    };
    setProcessedMaterials([...processedMaterials, newMaterial]);
  };

  const handleRemoveProcessedMaterial = (id: string) => {
    setProcessedMaterials(processedMaterials.filter(m => m.id !== id));
  };

  const handleUpdateProcessedMaterial = (id: string, updates: Partial<ProcessedMaterial>) => {
    setProcessedMaterials(processedMaterials.map(m => 
      m.id === id ? { ...m, ...updates } : m
    ));
  };

  const handleSelectExistingRawMaterial = (id: string, rawMaterialId: number) => {
    const selectedMaterial = availableRawMaterials.find(m => m.id === rawMaterialId);
    if (selectedMaterial) {
      handleUpdateProcessedMaterial(id, {
        rawMaterialId: rawMaterialId,
        name: selectedMaterial.name,
        color: selectedMaterial.color,
        description: selectedMaterial.description || '',
        unitOfMeasure: selectedMaterial.quantityType,
        isNew: false
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (processedMaterials.length === 0) {
      setError('Please add at least one processed material');
      return;
    }

    // Validate all materials have required fields
    for (const material of processedMaterials) {
      if (!material.name || !material.color || material.quantity <= 0) {
        setError('All processed materials must have a name, color, and valid quantity');
        return;
      }
    }

    // Check that total processed quantities don't exceed recyclable quantities
    const recyclableQuantities = new Map<number, number>();
    recyclableItems.forEach(item => {
      recyclableQuantities.set(item.id, item.quantity);
    });

    const processedQuantities = new Map<number, number>();
    processedMaterials.forEach(material => {
      const current = processedQuantities.get(material.recyclableItemId) || 0;
      processedQuantities.set(material.recyclableItemId, current + material.quantity);
    });

    for (const [itemId, processedQty] of processedQuantities.entries()) {
      const recyclableQty = recyclableQuantities.get(itemId) || 0;
      if (processedQty > recyclableQty) {
        const item = recyclableItems.find(i => i.id === itemId);
        setError(`Total processed quantity for "${item?.name}" exceeds available quantity (${recyclableQty} ${item?.unitOfMeasure})`);
        return;
      }
    }

    try {
      setIsLoading(true);
      setError(null);

      // TODO: Create API endpoint for processing recyclables
      // For now, we'll need to create this endpoint in the backend
      const processRequest = {
        acquisitionId: acquisition.id,
        materials: processedMaterials.map(m => ({
          recyclableItemId: m.recyclableItemId,
          rawMaterialId: m.rawMaterialId || 0, // 0 means create new
          name: m.name,
          color: m.color,
          description: m.description,
          quantity: m.quantity,
          unitOfMeasure: m.unitOfMeasure
        }))
      };

      // This endpoint needs to be created
      await acquisitionApi.processAcquisition(acquisition.id, processRequest);
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to process acquisition');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  if (!isOpen) return null;

  const getTypeLabel = (type: AcquisitionType) => {
    return type === AcquisitionType.RawMaterials ? 'Raw Materials' : 'Recyclable Materials';
  };

  const getTotalProcessedForItem = (itemId: number): number => {
    return processedMaterials
      .filter(m => m.recyclableItemId === itemId)
      .reduce((sum, m) => sum + m.quantity, 0);
  };

  const getRemainingQuantity = (item: RecyclableItem): number => {
    return item.quantity - getTotalProcessedForItem(item.id);
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content create-acquisition-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Process Recyclable Materials</h2>
          <button className="close-button" onClick={handleClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="acquisition-form">
          {/* Error Message */}
          {error && (
            <div className="error-message">
              {error}
              <button type="button" onClick={() => setError(null)}>×</button>
            </div>
          )}

          {/* Info Message */}
          <div className="info-message">
            <strong>Processing Instructions:</strong> Transform recyclable materials into raw materials by specifying 
            the output materials and quantities. You can select existing raw materials or create new ones. 
            The processed materials will be added to your inventory.
          </div>

          {/* Acquisition Details - Compact Summary */}
          <div className="form-section">
            <h3><FileText size={20} /> Acquisition Details</h3>
            <div className="acquisition-summary">
              <div className="summary-row">
                <span className="summary-label">Title:</span>
                <span className="summary-value">{acquisition.title}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Type:</span>
                <span className="summary-value">{getTypeLabel(acquisition.type)}</span>
              </div>
              {acquisition.description && (
                <div className="summary-row">
                  <span className="summary-label">Description:</span>
                  <span className="summary-value">{acquisition.description}</span>
                </div>
              )}
              <div className="summary-row">
                <span className="summary-label">Assigned To:</span>
                <span className="summary-value">{acquisition.assignedToUserName || 'Unassigned'}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Received By:</span>
                <span className="summary-value">
                  {acquisition.receivedByUserName || 'N/A'} 
                  {acquisition.receivedAt ? ` on ${new Date(acquisition.receivedAt).toLocaleDateString()}` : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Transport & Supplier Details */}
          {(acquisition.transportCarName || acquisition.supplierName) && (
            <div className="form-section">
              <div className="details-grid">
                {/* Transport Details */}
                {acquisition.transportCarName && (
                  <div className="details-column">
                    <h4><Truck size={18} /> Transport</h4>
                    <div className="acquisition-summary">
                      <div className="summary-row">
                        <span className="summary-label">Vehicle:</span>
                        <span className="summary-value">{acquisition.transportCarName}</span>
                      </div>
                      {acquisition.transportPhoneNumber && (
                        <div className="summary-row">
                          <span className="summary-label">Phone:</span>
                          <span className="summary-value">{acquisition.transportPhoneNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Supplier Details */}
                {acquisition.supplierName && (
                  <div className="details-column">
                    <h4><Building2 size={18} /> Supplier</h4>
                    <div className="acquisition-summary">
                      <div className="summary-row">
                        <span className="summary-label">Name:</span>
                        <span className="summary-value">{acquisition.supplierName}</span>
                      </div>
                      {acquisition.supplierContact && (
                        <div className="summary-row">
                          <span className="summary-label">Contact:</span>
                          <span className="summary-value">{acquisition.supplierContact}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recyclable Materials & Processing */}
          <div className="form-section">
            <h3><Package size={20} /> Process Recyclable Materials</h3>
            
            {recyclableItems.map((item) => {
              const remainingQty = getRemainingQuantity(item);
              const itemProcessedMaterials = processedMaterials.filter(m => m.recyclableItemId === item.id);
              
              return (
                <div key={item.id} className="recyclable-item-card">
                  <div className="recyclable-header">
                    <div className="recyclable-info">
                      <h4>{item.name}</h4>
                      <p>Color: {item.color} | Available: <strong>{item.quantity} {item.unitOfMeasure}</strong></p>
                    </div>
                    <div className="remaining-quantity">
                      <span className={remainingQty === 0 ? 'fully-processed' : remainingQty < 0 ? 'over-processed' : ''}>
                        Remaining: <strong>{remainingQty} {item.unitOfMeasure}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Processed Materials from this Recyclable */}
                  {itemProcessedMaterials.length > 0 && (
                    <div className="processed-materials-list">
                      {itemProcessedMaterials.map((material) => (
                        <div key={material.id} className="processed-material-item">
                          <div className="form-row">
                            <div className="form-group">
                              <label>Select Raw Material or Create New</label>
                              <select
                                value={material.rawMaterialId || ''}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value === 'new') {
                                    handleUpdateProcessedMaterial(material.id, {
                                      rawMaterialId: null,
                                      name: '',
                                      color: '',
                                      description: '',
                                      isNew: true
                                    });
                                  } else if (value) {
                                    handleSelectExistingRawMaterial(material.id, parseInt(value));
                                  }
                                }}
                              >
                                <option value="">-- Select or Create New --</option>
                                <option value="new">➕ Create New Raw Material</option>
                                <optgroup label="Existing Raw Materials">
                                  {availableRawMaterials.map(rm => (
                                    <option key={rm.id} value={rm.id}>
                                      {rm.name} ({rm.color})
                                    </option>
                                  ))}
                                </optgroup>
                              </select>
                            </div>
                            <div className="form-group">
                              <label>Quantity</label>
                              <input
                                type="number"
                                value={material.quantity}
                                onChange={(e) => handleUpdateProcessedMaterial(material.id, { quantity: parseFloat(e.target.value) || 0 })}
                                min="0"
                                step="0.01"
                                required
                              />
                            </div>
                          </div>

                          {material.isNew && (
                            <>
                              <div className="form-row">
                                <div className="form-group">
                                  <label>Material Name</label>
                                  <input
                                    type="text"
                                    value={material.name}
                                    onChange={(e) => handleUpdateProcessedMaterial(material.id, { name: e.target.value })}
                                    placeholder="Enter material name"
                                    required
                                  />
                                </div>
                                <div className="form-group">
                                  <label>Color</label>
                                  <input
                                    type="text"
                                    value={material.color}
                                    onChange={(e) => handleUpdateProcessedMaterial(material.id, { color: e.target.value })}
                                    placeholder="Enter color"
                                    required
                                  />
                                </div>
                              </div>
                              <div className="form-row">
                                <div className="form-group">
                                  <label>Unit of Measure</label>
                                  <input
                                    type="text"
                                    value={material.unitOfMeasure}
                                    onChange={(e) => handleUpdateProcessedMaterial(material.id, { unitOfMeasure: e.target.value })}
                                    placeholder="kg, liters, etc."
                                    required
                                  />
                                </div>
                                <div className="form-group">
                                  <label>Description (Optional)</label>
                                  <input
                                    type="text"
                                    value={material.description}
                                    onChange={(e) => handleUpdateProcessedMaterial(material.id, { description: e.target.value })}
                                    placeholder="Enter description"
                                  />
                                </div>
                              </div>
                            </>
                          )}

                          {!material.isNew && material.rawMaterialId && (
                            <div className="selected-material-info">
                              <p><strong>Selected:</strong> {material.name} ({material.color}) - {material.unitOfMeasure}</p>
                            </div>
                          )}

                          <button
                            type="button"
                            className="remove-material-button"
                            onClick={() => handleRemoveProcessedMaterial(material.id)}
                          >
                            <Trash2 size={16} /> Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Processed Material Button */}
                  <button
                    type="button"
                    className="add-processed-material-button"
                    onClick={() => handleAddProcessedMaterial(item)}
                  >
                    <Plus size={16} /> Add Processed Material
                  </button>
                </div>
              );
            })}
          </div>

          {/* Submit Button */}
          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={isLoading || processedMaterials.length === 0}
            >
              {isLoading ? 'Processing...' : 'Complete Processing & Add to Inventory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProcessAcquisition;

