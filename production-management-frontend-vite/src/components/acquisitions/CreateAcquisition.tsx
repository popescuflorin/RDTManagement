import React, { useState, useEffect } from 'react';
import { acquisitionApi, inventoryApi, supplierApi, transportApi, userApi } from '../../services/api';
import type { RawMaterial, CreateAcquisitionRequest, Supplier, CreateSupplierRequest, Transport, CreateTransportRequest, User } from '../../types';
import { AcquisitionType, MaterialType } from '../../types';
import { X, Plus, Trash2, Building2, FileText, Truck, Package, UserCircle } from 'lucide-react';
import './CreateAcquisition.css';

interface CreateAcquisitionProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface AcquisitionItem {
  id: string;
  rawMaterialId?: number;
  name: string;
  color: string;
  description: string;
  quantity: number;
  unitOfMeasure: string;
  isNew: boolean;
}

const CreateAcquisition: React.FC<CreateAcquisitionProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [transports, setTransports] = useState<Transport[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [materialError, setMaterialError] = useState<string | null>(null);
  
  // Form data
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedAssignedUserId, setSelectedAssignedUserId] = useState<number | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);
  const [supplierContact, setSupplierContact] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    // Set default due date to current date in YYYY-MM-DD format
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // Transport details
  const [selectedTransportId, setSelectedTransportId] = useState<number | null>(null);
  const [transportSearchTerm, setTransportSearchTerm] = useState('');
  const [showTransportDropdown, setShowTransportDropdown] = useState(false);
  const [transportNumberPlate, setTransportNumberPlate] = useState('');
  const [transportPhoneNumber, setTransportPhoneNumber] = useState('');
  const [transportDate, setTransportDate] = useState(() => {
    // Set default due date to current date in YYYY-MM-DD format
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [transportNotes, setTransportNotes] = useState('');
  const [acquisitionType, setAcquisitionType] = useState<AcquisitionType>(AcquisitionType.RawMaterials);
  
  // Supplier creation state
  const [showCreateSupplier, setShowCreateSupplier] = useState(false);
  const [newSupplier, setNewSupplier] = useState<Partial<CreateSupplierRequest>>({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    country: ''
  });
  
  // Items management
  const [items, setItems] = useState<AcquisitionItem[]>([]);
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [newItem, setNewItem] = useState<Partial<AcquisitionItem>>({
    name: '',
    color: '',
    description: '',
    quantity: 0,
    unitOfMeasure: '',
    isNew: true
  });

  // Material search state
  const [materialSearchTerm, setMaterialSearchTerm] = useState('');
  const [showMaterialDropdown, setShowMaterialDropdown] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadRawMaterials();
      loadSuppliers();
      loadTransports();
      loadUsers();
      resetForm();
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.material-search-container')) {
        setShowMaterialDropdown(false);
        setShowTransportDropdown(false);
      }
    };

    if (showMaterialDropdown || showTransportDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMaterialDropdown, showTransportDropdown]);

  // Reset material search, dropdown, and selected items when acquisition type changes
  useEffect(() => {
    // Clear the material search term to refresh the filtered results
    setMaterialSearchTerm('');
    setShowMaterialDropdown(false);
    
    // Clear all selected items
    setItems([]);
    
    // Clear the new item form if it was filled
    setNewItem({
      name: '',
      color: '',
      description: '',
      quantity: 0,
      unitOfMeasure: '',
      isNew: true
    });
    
    // Close the add item form
    setShowAddItemForm(false);
  }, [acquisitionType]);

  const loadRawMaterials = async () => {
    try {
      const response = await inventoryApi.getAllMaterials();
      setRawMaterials(response.data);
    } catch (err: any) {
      setError('Failed to load raw materials');
    }
  };

  const loadSuppliers = async () => {
    try {
      const response = await supplierApi.getAllSuppliers();
      setSuppliers(response.data);
    } catch (err: any) {
      setError('Failed to load suppliers');
    }
  };

  const loadTransports = async () => {
    try {
      const response = await transportApi.getAllTransports();
      setTransports(response.data);
    } catch (err: any) {
      setError('Failed to load transports');
    }
  };

  const loadUsers = async () => {
    try {
      const response = await userApi.getAllUsers();
      setUsers(response.data);
      
      // Set default assigned user to current user
      const currentUser = localStorage.getItem('user');
      if (currentUser) {
        const userData = JSON.parse(currentUser);
        setSelectedAssignedUserId(userData.id);
      }
    } catch (err: any) {
      setError('Failed to load users');
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    
    // Reset assigned user to current user
    const currentUser = localStorage.getItem('user');
    if (currentUser) {
      const userData = JSON.parse(currentUser);
      setSelectedAssignedUserId(userData.id);
    } else {
      setSelectedAssignedUserId(null);
    }
    
    setSelectedSupplierId(null);
    setSupplierContact('');
    setNotes('');
    setDueDate(() => {
      // Reset due date to current date
      const today = new Date();
      return today.toISOString().split('T')[0];
    });
    setAcquisitionType(AcquisitionType.RawMaterials);
    setItems([]);
    setShowAddItemForm(false);
    setShowCreateSupplier(false);
    
    // Reset transport details
    setSelectedTransportId(null);
    setTransportSearchTerm('');
    setShowTransportDropdown(false);
    setTransportNumberPlate('');
    setTransportPhoneNumber('');
    setTransportDate(() => {
      // Reset due date to current date
      const today = new Date();
      return today.toISOString().split('T')[0];
    });
    setTransportNotes('');
    setNewItem({
      name: '',
      description: '',
      quantity: 0,
      unitOfMeasure: '',
      isNew: true
    });
    setNewSupplier({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      country: ''
    });
    setMaterialSearchTerm('');
    setShowMaterialDropdown(false);
    setError(null);
    setMaterialError(null);
  };

  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    // Prevent number input from changing value when scrolling
    if (e.currentTarget.type === 'number') {
      e.currentTarget.blur();
    }
  };

  const handleAddNewMaterial = () => {
    if (!newItem.name || !newItem.color || !newItem.unitOfMeasure || !newItem.quantity || newItem.quantity <= 0) {
      setMaterialError('Please fill in all required fields for the new material');
      return;
    }

    const newItemData: AcquisitionItem = {
      id: newItem.id ?? `new-${Date.now()}`,
      name: newItem.name!,
      color: newItem.color!,
      description: newItem.description || '',
      quantity: newItem.quantity!,
      unitOfMeasure: newItem.unitOfMeasure!,
      isNew: true
    };
    
    setItems([...items, newItemData]);
    setNewItem({
      name: '',
      color: '',
      description: '',
      quantity: 0,
      unitOfMeasure: '',
      isNew: true
    });
    setShowAddItemForm(false);
    setMaterialSearchTerm('');
    setMaterialError(null);
  };

  const handleUpdateItem = (id: string, updates: Partial<AcquisitionItem>) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  // Filter materials based on search term and acquisition type
  const filteredMaterials = rawMaterials.filter(material => {
    // Filter by acquisition type - only show materials matching the acquisition type
    const matchesType = (acquisitionType === AcquisitionType.RawMaterials && material.type === MaterialType.RawMaterial) ||
                        (acquisitionType === AcquisitionType.RecyclableMaterials && material.type === MaterialType.RecyclableMaterial);
    
    const matchesSearch = material.name.toLowerCase().includes(materialSearchTerm.toLowerCase()) ||
                         material.color.toLowerCase().includes(materialSearchTerm.toLowerCase());
    
    return matchesType && matchesSearch;
  });

  // Handle material search input
  const handleMaterialSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMaterialSearchTerm(value);
    setShowMaterialDropdown(true);
    setNewItem(prev => ({ ...prev, name: value, isNew: true }));

    if (value.trim() === '') {
      setNewItem(prev => ({ ...prev, name: '', color: '', unitOfMeasure: '', description: '', quantity: 0, isNew: true }));
    }
  };

  // Handle material selection from dropdown
  const handleMaterialSelect = (material: RawMaterial) => {
    setNewItem(prev => ({
      ...prev,
      name: material.name,
      color: material.color,
      description: material.description || '',
      unitOfMeasure: material.quantityType,
      isNew: false,
      id: material.id.toString()
    }));
    setMaterialSearchTerm(`${material.name} (${material.color})`);
    setShowMaterialDropdown(false);
  };

  const handleCreateSupplier = async () => {
    if (!newSupplier.name?.trim()) {
      setError('Supplier name is required');
      return;
    }

    try {
      const response = await supplierApi.createSupplier(newSupplier as CreateSupplierRequest);
      setSuppliers([...suppliers, response.data]);
      setSelectedSupplierId(response.data.id);
      setShowCreateSupplier(false);
      if (newSupplier) {
        // Use contact person, phone, or email as contact info
        let contactInfo = '';
        if (newSupplier.contactPerson) {
          contactInfo = newSupplier.contactPerson;
        }
        if (newSupplier.phone) {
          contactInfo += contactInfo ? ` | ${newSupplier.phone}` : newSupplier.phone;
        }
        if (newSupplier.email) {
          contactInfo += contactInfo ? ` | ${newSupplier.email}` : newSupplier.email;
        }
        setSupplierContact(contactInfo);
      } else {
        setSupplierContact('');
      }
      setNewSupplier({
        name: '',
        contactPerson: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        country: ''
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create supplier');
    }
  };

  const handleSupplierChange = (supplierId: string) => {
    if (supplierId === 'new') {
      setShowCreateSupplier(true);
      setSelectedSupplierId(null);
      setSupplierContact('');
    } else if (supplierId === 'none') {
      setSelectedSupplierId(null);
      setShowCreateSupplier(false);
      setSupplierContact('');
    } else {
      const supplierIdNum = parseInt(supplierId);
      setSelectedSupplierId(supplierIdNum);
      setShowCreateSupplier(false);
      
      // Find the selected supplier and populate contact field
      const selectedSupplier = suppliers.find(s => s.id === supplierIdNum);
      if (selectedSupplier) {
        // Use contact person, phone, or email as contact info
        let contactInfo = '';
        if (selectedSupplier.contactPerson) {
          contactInfo = selectedSupplier.contactPerson;
        }
        if (selectedSupplier.phone) {
          contactInfo += contactInfo ? ` | ${selectedSupplier.phone}` : selectedSupplier.phone;
        }
        if (selectedSupplier.email) {
          contactInfo += contactInfo ? ` | ${selectedSupplier.email}` : selectedSupplier.email;
        }
        setSupplierContact(contactInfo);
      } else {
        setSupplierContact('');
      }
    }
  };

  const handleTransportSearchChange = (value: string) => {
    setTransportSearchTerm(value);
    setShowTransportDropdown(true);
    
    // If user clears the search, also clear the selected transport, number plate and phone
    if (!value.trim()) {
      setSelectedTransportId(null);
      setTransportNumberPlate('');
      setTransportPhoneNumber('');
    }
  };

  const handleTransportInputFocus = () => {
    setShowTransportDropdown(true);
  };

  const handleTransportSelect = (transport: Transport) => {
    setSelectedTransportId(transport.id);
    setTransportSearchTerm(transport.carName);
    // Ensure number plate is set correctly (handle null, undefined, or empty string)
    setTransportNumberPlate(transport.numberPlate ?? '');
    setTransportPhoneNumber(transport.phoneNumber);
    setShowTransportDropdown(false);
  };

  const filteredTransports = transports.filter(transport =>
    transport.carName.toLowerCase().includes(transportSearchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (items.length === 0) {
      setError('At least one item is required');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      let transportId = selectedTransportId;

      // If a transport car name is entered but not selected from dropdown, create new transport
      if (transportSearchTerm.trim() && !selectedTransportId && transportPhoneNumber.trim()) {
        const newTransportRequest: CreateTransportRequest = {
          carName: transportSearchTerm.trim(),
          numberPlate: transportNumberPlate.trim() || undefined,
          phoneNumber: transportPhoneNumber.trim()
        };
        const transportResponse = await transportApi.createTransport(newTransportRequest);
        transportId = transportResponse.data.id;
      }

      const createRequest: CreateAcquisitionRequest = {
        title: title.trim(),
        description: description.trim(),
        type: acquisitionType,
        assignedToUserId: selectedAssignedUserId || undefined,
        supplierId: selectedSupplierId || undefined,
        supplierContact: supplierContact.trim() || undefined,
        notes: notes.trim() || undefined,
        dueDate: dueDate || undefined,
        transportId: transportId || undefined,
        transportDate: transportDate || undefined,
        transportNotes: transportNotes.trim() || undefined,
        items: items.map(item => {
          // Try to parse the id as an integer, default to 0 if it fails
          const parsedId = parseInt(item.id);
          const rawMaterialId = isNaN(parsedId) ? 0 : parsedId;
          
          return {
            rawMaterialId: rawMaterialId, // Will be 0 for new materials
            name: item.name,
            color: item.color,
            description: item.description,
            quantity: item.quantity,
            quantityType: item.unitOfMeasure
          };
        })
      };

      await acquisitionApi.createAcquisition(createRequest);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create acquisition');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Prevent closing on backdrop click - only allow closing via buttons
    e.stopPropagation();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content create-acquisition-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Acquisition</h2>
          <button className="close-button" onClick={handleClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="acquisition-form">
          {/* Error Message */}
          {error && (
            <div className="error-message">
              {error}
              <button onClick={() => setError(null)}>×</button>
            </div>
          )}

          {/* Basic Information */}
          <div className="form-section">
            <h3><FileText size={20} />Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="title">Details *</label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Enter acquisition title"
                />
              </div>
              <div className="form-group">
                <label htmlFor="type">Type</label>
                <select
                  id="type"
                  value={acquisitionType}
                  onChange={(e) => setAcquisitionType(Number(e.target.value) as AcquisitionType)}
                >
                  <option value={AcquisitionType.RawMaterials}>Raw Materials</option>
                  <option value={AcquisitionType.RecyclableMaterials}>Recyclable Materials</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="assignedUser"><UserCircle size={16} style={{display: 'inline', marginRight: '4px'}} /> Assigned User</label>
                <select
                  id="assignedUser"
                  value={selectedAssignedUserId || ''}
                  onChange={(e) => setSelectedAssignedUserId(e.target.value ? parseInt(e.target.value) : null)}
                >
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} ({user.username})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter acquisition description"
                rows={3}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="dueDate">Due Date</label>
                <input
                  type="date"
                  id="dueDate"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  placeholder="Select due date"
                />
              </div>
              <div className="form-group">
                <label htmlFor="notes">Notes</label>
                <input
                  type="text"
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes"
                />
              </div>
            </div>
          </div>

          {/* Transport Details Section */}
          <div className="form-section">
            <h3><Truck size={20} /> Transport Details</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="transportCarName">Car Name</label>
                  <div className="material-search-container">
                    <input
                      type="text"
                      id="transportCarName"
                      value={transportSearchTerm}
                      onChange={(e) => handleTransportSearchChange(e.target.value)}
                      onFocus={handleTransportInputFocus}
                      placeholder="Search or enter car/vehicle name"
                    />
                    {showTransportDropdown && (
                      <div className="material-dropdown">
                        {filteredTransports.length > 0 ? (
                          filteredTransports.map((transport) => (
                            <div
                              key={transport.id}
                              className="material-option"
                              onClick={() => handleTransportSelect(transport)}
                            >
                              <div>
                                <strong>{transport.carName}</strong>
                                {transport.numberPlate && <small> - {transport.numberPlate}</small>}
                                <small> | {transport.phoneNumber}</small>
                              </div>
                            </div>
                          ))
                        ) : transportSearchTerm ? (
                          <div className="material-option material-option-create">
                            <div>
                              <strong>Create new transport:</strong> {transportSearchTerm}
                              <small>Enter phone number and submit to create</small>
                            </div>
                          </div>
                        ) : (
                          <div className="material-option">
                            <div>
                              <small>Start typing to search or create a new transport</small>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="transportNumberPlate">Number Plate</label>
                  <input
                    type="text"
                    id="transportNumberPlate"
                    value={transportNumberPlate}
                    onChange={(e) => setTransportNumberPlate(e.target.value)}
                    placeholder="Enter number plate (optional)"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="transportPhoneNumber">Phone Number</label>
                  <input
                    type="tel"
                    id="transportPhoneNumber"
                    value={transportPhoneNumber}
                    onChange={(e) => setTransportPhoneNumber(e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="transportDate">Transport Date</label>
                  <input
                    type="date"
                    id="transportDate"
                    value={transportDate}
                    onChange={(e) => setTransportDate(e.target.value)}
                    placeholder="Select transport date"
                  />
                </div>
              </div>
          </div>

          {/* Supplier Section */}
          <div className="form-section">
            <h3><Building2 size={20} /> Supplier</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="supplier">Supplier</label>
                <select
                  id="supplier"
                  value={selectedSupplierId || 'none'}
                  onChange={(e) => handleSupplierChange(e.target.value)}
                >
                  <option value="none">No Supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                  <option value="new">+ Create New Supplier</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="supplierContact">Supplier Contact</label>
                <input
                  type="text"
                  id="supplierContact"
                  value={supplierContact}
                  onChange={(e) => setSupplierContact(e.target.value)}
                  placeholder="Contact information"
                />
              </div>
            </div>

            {/* Create New Supplier Form */}
            {showCreateSupplier && (
              <div className="supplier-creation-form">
                <h4>Create New Supplier</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="supplierName">Supplier Name *</label>
                    <input
                      type="text"
                      id="supplierName"
                      value={newSupplier.name || ''}
                      onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                      placeholder="Enter supplier name"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="supplierContactPerson">Contact Person</label>
                    <input
                      type="text"
                      id="supplierContactPerson"
                      value={newSupplier.contactPerson || ''}
                      onChange={(e) => setNewSupplier({ ...newSupplier, contactPerson: e.target.value })}
                      placeholder="Contact person name"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="supplierPhone">Phone</label>
                    <input
                      type="text"
                      id="supplierPhone"
                      value={newSupplier.phone || ''}
                      onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                      placeholder="Phone number"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="supplierEmail">Email</label>
                    <input
                      type="email"
                      id="supplierEmail"
                      value={newSupplier.email || ''}
                      onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                      placeholder="Email address"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="supplierAddress">Address</label>
                    <input
                      type="text"
                      id="supplierAddress"
                      value={newSupplier.address || ''}
                      onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                      placeholder="Street address"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="supplierCity">City</label>
                    <input
                      type="text"
                      id="supplierCity"
                      value={newSupplier.city || ''}
                      onChange={(e) => setNewSupplier({ ...newSupplier, city: e.target.value })}
                      placeholder="City"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="supplierCountry">Country</label>
                  <input
                    type="text"
                    id="supplierCountry"
                    value={newSupplier.country || ''}
                    onChange={(e) => setNewSupplier({ ...newSupplier, country: e.target.value })}
                    placeholder="Country"
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="save-item-button"
                    onClick={handleCreateSupplier}
                  >
                    <Building2 size={16} />
                     Create Supplier
                  </button>
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={() => setShowCreateSupplier(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Materials Section */}
          <div className="form-section">
            <div className="section-header">
              <h3><Package size={20} /> Materials</h3>
              <button
                type="button"
                className="add-item-button"
                onClick={() => setShowAddItemForm(!showAddItemForm)}
              >
                <Plus size={20} />
                Add Material
              </button>
            </div>

            {/* Material Error Message */}
            {materialError && (
              <div className="error-message">
                {materialError}
                <button onClick={() => setMaterialError(null)}>×</button>
              </div>
            )}

            {/* Add Item Form */}
            {showAddItemForm && (
              <div className="add-item-form">
                <div className="form-row">
                  <div className="form-group material-search-group">
                    <label htmlFor="materialSearch">Material Name *</label>
                    <div className="material-search-container">
                      <input
                        type="text"
                        id="materialSearch"
                        value={materialSearchTerm}
                        onChange={handleMaterialSearchChange}
                        onFocus={() => setShowMaterialDropdown(true)}
                        placeholder="Search for material or enter new name..."
                        className="material-search-input"
                      />
                      {showMaterialDropdown && (
                        <div className="material-dropdown">
                          {filteredMaterials.length > 0 ? (
                            filteredMaterials.map(material => (
                              <div
                                key={material.id}
                                className="material-option"
                                onClick={() => handleMaterialSelect(material)}
                              >
                                <div className="material-option-main">
                                  <span className="material-name">{material.name}</span>
                                  <span className="material-color">({material.color})</span>
                                </div>
                                <div className="material-option-details">
                                  {material.quantity} {material.quantityType} available
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="material-option no-results">
                              No materials found - will create new material
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="itemColor">Color *</label>
                    <input
                      type="text"
                      id="itemColor"
                      value={newItem.color || ''}
                      onChange={(e) => setNewItem({ ...newItem, color: e.target.value })}
                      placeholder="Enter material color"
                      disabled={!newItem.isNew}
                      className={!newItem.isNew ? 'disabled-field' : ''}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="itemQuantity">Quantity *</label>
                    <input
                      type="number"
                      id="itemQuantity"
                      value={newItem.quantity || ''}
                      onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) || 0 })}
                      onWheel={handleWheel}
                      min="0"
                      step="0.01"
                      placeholder="0"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="itemUnit">Unit of Measure *</label>
                    <input
                      type="text"
                      id="itemUnit"
                      value={newItem.unitOfMeasure || ''}
                      onChange={(e) => setNewItem({ ...newItem, unitOfMeasure: e.target.value })}
                      placeholder="e.g., kg, liters, pieces"
                      disabled={!newItem.isNew}
                      className={!newItem.isNew ? 'disabled-field' : ''}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="itemDescription">Description</label>
                  <textarea
                    id="itemDescription"
                    value={newItem.description || ''}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    placeholder="Material description"
                    rows={2}
                    disabled={!newItem.isNew}
                    className={!newItem.isNew ? 'disabled-field' : ''}
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="save-item-button"
                    onClick={handleAddNewMaterial}
                  >
                    Add Material
                  </button>
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={() => setShowAddItemForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}


            {/* Selected Items */}
            {items.length > 0 && (
              <div className="selected-items">
                <h4>Selected Materials ({items.length})</h4>
                <div className="items-list">
                  {items.map((item) => (
                    <div key={item.id} className="item-card">
                      <div className="item-info">
                        <div className="item-name">{item.name}</div>
                        <div className="item-color">Color: {item.color}</div>
                        {item.description && (
                          <div className="item-description">{item.description}</div>
                        )}
                      </div>
                      <div className="item-details">
                        <div className="form-row">
                          <div className="form-group">
                            <label>Quantity</label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleUpdateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                              onWheel={handleWheel}
                              min="0"
                              step="0.01"
                            />
                          </div>
                          <div className="form-group">
                            <label>Unit</label>
                            <input
                              type="text"
                              value={item.unitOfMeasure}
                              onChange={(e) => handleUpdateItem(item.id, { unitOfMeasure: e.target.value })}
                              disabled={true}
                              className={!item.isNew ? 'disabled-field' : ''}
                            />
                          </div>
                        </div>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Color</label>
                            <input
                              type="text"
                              value={item.color}
                              onChange={(e) => handleUpdateItem(item.id, { color: e.target.value })}
                              placeholder="Enter color"
                              disabled={true}
                              className={!item.isNew ? 'disabled-field' : ''}
                            />
                          </div>
                        </div>
                        <div className="form-group">
                          <label>Description</label>
                          <textarea
                            value={item.description}
                            onChange={(e) => handleUpdateItem(item.id, { description: e.target.value })}
                            placeholder="Material description"
                            rows={2}
                            disabled={true}
                            className={!item.isNew ? 'disabled-field' : ''}
                          />
                        </div>
                        <div className="item-total">
                          Quantity: {item.quantity} {item.unitOfMeasure}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="remove-item-button"
                        onClick={() => handleRemoveItem(item.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Items Summary */}
            {items.length > 0 && (
              <div className="total-cost">
                <strong>
                  Total Items: {items.length} materials selected
                </strong>
              </div>
            )}
          </div>

          {/* Form Actions */}
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
              disabled={isLoading || !title.trim() || items.length === 0}
            >
              {isLoading ? 'Creating...' : 'Create Acquisition'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAcquisition;
