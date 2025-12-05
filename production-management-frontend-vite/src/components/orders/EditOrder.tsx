import React, { useState, useEffect } from 'react';
import { orderApi, inventoryApi, transportApi, clientApi, userApi } from '../../services/api';
import type { RawMaterial, UpdateOrderRequest, Transport, CreateTransportRequest, Client, CreateClientRequest, Order, User } from '../../types';
import { MaterialType } from '../../types';
import { X, Plus, Trash2, UserCircle, Truck, Package, FileText } from 'lucide-react';
import './CreateOrder.css';

interface EditOrderProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  order: Order;
}

interface OrderItem {
  id?: number;
  rawMaterialId: number;
  materialName: string;
  materialColor: string;
  quantityType: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

const EditOrder: React.FC<EditOrderProps> = ({
  isOpen,
  onClose,
  onSuccess,
  order
}) => {
  const [finishedProducts, setFinishedProducts] = useState<RawMaterial[]>([]);
  const [transports, setTransports] = useState<Transport[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form data
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');

  // Client details
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [clientContact, setClientContact] = useState('');
  const [showCreateClient, setShowCreateClient] = useState(false);
  
  // User assignment
  const [selectedAssignedUserId, setSelectedAssignedUserId] = useState<number | null>(null);
  const [newClientData, setNewClientData] = useState<CreateClientRequest>({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    notes: ''
  });

  // Transport details
  const [selectedTransportId, setSelectedTransportId] = useState<number | null>(null);
  const [transportSearchTerm, setTransportSearchTerm] = useState('');
  const [showTransportDropdown, setShowTransportDropdown] = useState(false);
  const [transportNumberPlate, setTransportNumberPlate] = useState('');
  const [transportPhoneNumber, setTransportPhoneNumber] = useState('');
  const [transportDate, setTransportDate] = useState('');
  const [transportNotes, setTransportNotes] = useState('');
  
  // Order items
  const [items, setItems] = useState<OrderItem[]>([]);
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [newItem, setNewItem] = useState({
    rawMaterialId: 0,
    quantity: 1
  });

  // Material search state
  const [materialSearchTerm, setMaterialSearchTerm] = useState('');
  const [showMaterialDropdown, setShowMaterialDropdown] = useState(false);

  useEffect(() => {
    if (isOpen && order) {
      loadData();
      populateFormData();
    }
  }, [isOpen, order]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.material-search-container') && !target.closest('.transport-search-container')) {
        setShowMaterialDropdown(false);
        setShowTransportDropdown(false);
      }
    };

    if (showMaterialDropdown || showTransportDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMaterialDropdown, showTransportDropdown]);

  const populateFormData = () => {
    setDescription(order.description || '');
    setNotes(order.notes || '');
    setOrderDate(order.orderDate ? order.orderDate.split('T')[0] : '');
    setExpectedDeliveryDate(order.expectedDeliveryDate ? order.expectedDeliveryDate.split('T')[0] : '');
    
    // Client details
    setSelectedClientId(order.clientId || null);
    // Build client contact from available fields
    let contactInfo = '';
    if (order.clientContactPerson) {
      contactInfo = order.clientContactPerson;
    }
    if (order.clientPhone) {
      contactInfo += contactInfo ? ` | ${order.clientPhone}` : order.clientPhone;
    }
    if (order.clientEmail) {
      contactInfo += contactInfo ? ` | ${order.clientEmail}` : order.clientEmail;
    }
    setClientContact(contactInfo);
    
    // User assignment
    setSelectedAssignedUserId(order.assignedToUserId || null);
    
    // Transport details
    setSelectedTransportId(order.transportId || null);
    setTransportSearchTerm(order.transportCarName || '');
    setTransportNumberPlate(order.transportNumberPlate || '');
    setTransportPhoneNumber(order.transportPhoneNumber || '');
    setTransportDate(order.transportDate ? order.transportDate.split('T')[0] : '');
    setTransportNotes(order.transportNotes || '');
    
    // Convert order materials to local format
    const mappedItems: OrderItem[] = order.orderMaterials.map(item => ({
      id: item.id,
      rawMaterialId: item.rawMaterialId,
      materialName: item.materialName,
      materialColor: item.materialColor,
      quantityType: item.quantityType,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice
    }));
    setItems(mappedItems);
  };

  const loadData = async () => {
    try {
      // Load only Finished Products
      const materialsResponse = await inventoryApi.getAllMaterialsIncludingInactive();
      const finishedProducts = materialsResponse.data.filter(
        (m: RawMaterial) => m.isActive && m.type === MaterialType.FinishedProduct
      );
      setFinishedProducts(finishedProducts);

      // Load transports
      const transportsResponse = await transportApi.getAllTransports();
      setTransports(transportsResponse.data);

      // Load clients
      const clientsResponse = await clientApi.getAllClients();
      setClients(clientsResponse.data);

      // Load users
      const usersResponse = await userApi.getAllUsers();
      setUsers(usersResponse.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load data');
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    // Prevent number input from changing value when scrolling
    if (e.currentTarget.type === 'number') {
      e.currentTarget.blur();
    }
  };

  const handleAddItem = () => {
    if (newItem.rawMaterialId === 0 || newItem.quantity <= 0) {
      setError('Please select a material and enter a valid quantity');
      return;
    }

    const material = finishedProducts.find(m => m.id === newItem.rawMaterialId);
    if (!material) {
      setError('Material not found');
      return;
    }

    // Check if material is already added
    if (items.some(item => item.rawMaterialId === newItem.rawMaterialId)) {
      setError('Material already added to order');
      return;
    }

    // Note: We allow ordering more than available quantity for future fulfillment
    // The inventory "Requested Quantity" feature will track over-commitments

    const unitPrice = material.unitCost > 0 ? material.unitCost : 0;
    const newItemData: OrderItem = {
      rawMaterialId: material.id,
      materialName: material.name,
      materialColor: material.color,
      quantityType: material.quantityType,
      quantity: newItem.quantity,
      unitPrice,
      totalPrice: unitPrice * newItem.quantity
    };

    setItems([...items, newItemData]);
    setNewItem({ rawMaterialId: 0, quantity: 1 });
    setMaterialSearchTerm('');
    setShowMaterialDropdown(false);
  };

  const handleUpdateItem = (index: number, updates: Partial<OrderItem>) => {
    const updatedItem = { ...items[index], ...updates };
    if (updates.quantity !== undefined) {
      updatedItem.totalPrice = updatedItem.unitPrice * updatedItem.quantity;
    }
    setItems(items.map((item, i) => 
      i === index ? updatedItem : item
    ));
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Filter materials based on search term - only Finished Products
  const filteredMaterials = finishedProducts.filter(material => {
    const matchesSearch = material.name.toLowerCase().includes(materialSearchTerm.toLowerCase()) ||
                         material.color.toLowerCase().includes(materialSearchTerm.toLowerCase());
    return matchesSearch;
  });

  // Handle material search input
  const handleMaterialSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMaterialSearchTerm(value);
    setShowMaterialDropdown(true);
  };

  // Handle material selection from dropdown
  const handleMaterialSelect = (material: RawMaterial) => {
    setNewItem({
      rawMaterialId: material.id,
      quantity: 1
    });
    setMaterialSearchTerm(`${material.name} (${material.color})`);
    setShowMaterialDropdown(false);
  };

  const handleClientChange = (clientId: string) => {
    if (clientId === 'new') {
      setShowCreateClient(true);
      setSelectedClientId(null);
      setClientContact('');
    } else if (clientId === 'none') {
      setSelectedClientId(null);
      setShowCreateClient(false);
      setClientContact('');
    } else {
      const clientIdNum = parseInt(clientId);
      setSelectedClientId(clientIdNum);
      setShowCreateClient(false);
      
      const selectedClient = clients.find(c => c.id === clientIdNum);
      if (selectedClient) {
        let contactInfo = '';
        if (selectedClient.contactPerson) {
          contactInfo = selectedClient.contactPerson;
        }
        if (selectedClient.phone) {
          contactInfo += contactInfo ? ` | ${selectedClient.phone}` : selectedClient.phone;
        }
        if (selectedClient.email) {
          contactInfo += contactInfo ? ` | ${selectedClient.email}` : selectedClient.email;
        }
        setClientContact(contactInfo);
      } else {
        setClientContact('');
      }
    }
  };

  const handleCreateClient = async () => {
    if (!newClientData.name?.trim()) {
      setError('Client name is required');
      return;
    }

    try {
      const response = await clientApi.createClient(newClientData);
      setClients([...clients, response.data]);
      setSelectedClientId(response.data.id);
      setShowCreateClient(false);
      if (newClientData) {
        let contactInfo = '';
        if (newClientData.contactPerson) {
          contactInfo = newClientData.contactPerson;
        }
        if (newClientData.phone) {
          contactInfo += contactInfo ? ` | ${newClientData.phone}` : newClientData.phone;
        }
        if (newClientData.email) {
          contactInfo += contactInfo ? ` | ${newClientData.email}` : newClientData.email;
        }
        setClientContact(contactInfo);
      } else {
        setClientContact('');
      }
      setNewClientData({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        postalCode: '',
        country: '',
        notes: ''
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create client');
    }
  };

  const handleTransportSearchChange = (value: string) => {
    setTransportSearchTerm(value);
    setShowTransportDropdown(true);
    
    if (!value.trim()) {
      setSelectedTransportId(null);
      setTransportNumberPlate('');
      setTransportPhoneNumber('');
    }
  };

  const handleTransportSelect = (transport: Transport) => {
    setSelectedTransportId(transport.id);
    setTransportSearchTerm(transport.carName);
    // Ensure number plate is set correctly (handle null, undefined, or empty string)
    setTransportNumberPlate(transport.numberPlate ?? '');
    setTransportPhoneNumber(transport.phoneNumber);
    setShowTransportDropdown(false);
  };

  const handleCreateNewTransport = async () => {
    if (!transportSearchTerm.trim()) {
      setError('Transport car name is required');
      return;
    }

    if (!transportPhoneNumber.trim()) {
      setError('Transport phone number is required');
      return;
    }

    try {
      const newTransportRequest: CreateTransportRequest = {
        carName: transportSearchTerm.trim(),
        numberPlate: transportNumberPlate.trim() || undefined,
        phoneNumber: transportPhoneNumber.trim()
      };
      const response = await transportApi.createTransport(newTransportRequest);
      const createdTransport = response.data;
      
      // Refresh transports list
      const transportsResponse = await transportApi.getAllTransports();
      setTransports(transportsResponse.data);
      
      // Select the newly created transport
      setSelectedTransportId(createdTransport.id);
      setTransportSearchTerm(createdTransport.carName);
      setShowTransportDropdown(false);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create transport');
    }
  };

  const filteredTransports = transports.filter(transport =>
    transport.carName.toLowerCase().includes(transportSearchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClientId) {
      setError('Please select or create a client');
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

      // If transport name is entered but not selected, create new transport
      if (transportSearchTerm.trim() && !selectedTransportId && transportPhoneNumber.trim()) {
        const newTransportRequest: CreateTransportRequest = {
          carName: transportSearchTerm.trim(),
          phoneNumber: transportPhoneNumber.trim()
        };
        const transportResponse = await transportApi.createTransport(newTransportRequest);
        transportId = transportResponse.data.id;
      }

      const updateRequest: UpdateOrderRequest = {
        clientId: selectedClientId,
        description: description.trim() || undefined,
        notes: notes.trim() || undefined,
        orderDate: orderDate || undefined,
        expectedDeliveryDate: expectedDeliveryDate || undefined,
        transportId: transportId || undefined,
        transportDate: transportDate || undefined,
        transportNotes: transportNotes.trim() || undefined,
        assignedToUserId: selectedAssignedUserId || undefined,
        orderMaterials: items.map((item) => ({
          rawMaterialId: item.rawMaterialId,
          quantity: item.quantity
        }))
      };

      await orderApi.updateOrder(order.id, updateRequest);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update order');
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

  const totalValue = items.reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <div className="create-order-overlay" onClick={handleBackdropClick}>
      <div className="create-order-modal" onClick={(e) => e.stopPropagation()}>
        <div className="create-order-header">
          <div className="header-content">
            <div className="header-title">
              <Package className="header-icon" />
              <h2>Edit Order</h2>
            </div>
            <button className="close-button" onClick={handleClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="create-order-form">
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
                <label htmlFor="description">Description</label>
                <input
                  type="text"
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter order description"
                />
              </div>
              <div className="form-group">
                <label htmlFor="status">Status</label>
                <input
                  type="text"
                  id="status"
                  value={order.statusLabel || 'Draft'}
                  disabled
                  className="disabled-field"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="orderDate">Order Date</label>
                <input
                  type="date"
                  id="orderDate"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  placeholder="Select order date"
                />
              </div>
              <div className="form-group">
                <label htmlFor="expectedDeliveryDate">Expected Delivery Date</label>
                <input
                  type="date"
                  id="expectedDeliveryDate"
                  value={expectedDeliveryDate}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                  placeholder="Select expected delivery date"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes"
                rows={3}
              />
            </div>
          </div>

          {/* Client Information Section */}
          <div className="form-section">
            <h3><UserCircle size={20} /> Client</h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="assignedUser">Assigned To</label>
                <select
                  id="assignedUser"
                  value={selectedAssignedUserId || ''}
                  onChange={(e) => setSelectedAssignedUserId(e.target.value ? parseInt(e.target.value) : null)}
                  disabled={isLoading}
                >
                  <option value="">No Assignment</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} ({user.username})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="client">Client *</label>
                <select
                  id="client"
                  value={selectedClientId || 'none'}
                  onChange={(e) => handleClientChange(e.target.value)}
                  disabled={isLoading}
                >
                  <option value="none">No Client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                  <option value="new">+ Create New Client</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="clientContact">Client Contact</label>
                <input
                  type="text"
                  id="clientContact"
                  value={clientContact}
                  onChange={(e) => setClientContact(e.target.value)}
                  disabled={isLoading}
                  placeholder="Contact information"
                />
              </div>
            </div>

            {/* Create New Client Form */}
            {showCreateClient && (
              <div className="supplier-creation-form">
                <h4>Create New Client</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="clientName">Client Name *</label>
                    <input
                      type="text"
                      id="clientName"
                      value={newClientData.name || ''}
                      onChange={(e) => setNewClientData({ ...newClientData, name: e.target.value })}
                      placeholder="Enter client name"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="clientContactPerson">Contact Person</label>
                    <input
                      type="text"
                      id="clientContactPerson"
                      value={newClientData.contactPerson || ''}
                      onChange={(e) => setNewClientData({ ...newClientData, contactPerson: e.target.value })}
                      placeholder="Contact person name"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="clientPhone">Phone</label>
                    <input
                      type="text"
                      id="clientPhone"
                      value={newClientData.phone || ''}
                      onChange={(e) => setNewClientData({ ...newClientData, phone: e.target.value })}
                      placeholder="Phone number"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="clientEmail">Email</label>
                    <input
                      type="email"
                      id="clientEmail"
                      value={newClientData.email || ''}
                      onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })}
                      placeholder="Email address"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="clientAddress">Address</label>
                    <input
                      type="text"
                      id="clientAddress"
                      value={newClientData.address || ''}
                      onChange={(e) => setNewClientData({ ...newClientData, address: e.target.value })}
                      placeholder="Street address"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="clientCity">City</label>
                    <input
                      type="text"
                      id="clientCity"
                      value={newClientData.city || ''}
                      onChange={(e) => setNewClientData({ ...newClientData, city: e.target.value })}
                      placeholder="City"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="clientPostalCode">Postal Code</label>
                    <input
                      type="text"
                      id="clientPostalCode"
                      value={newClientData.postalCode || ''}
                      onChange={(e) => setNewClientData({ ...newClientData, postalCode: e.target.value })}
                      placeholder="Postal code"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="clientCountry">Country</label>
                    <input
                      type="text"
                      id="clientCountry"
                      value={newClientData.country || ''}
                      onChange={(e) => setNewClientData({ ...newClientData, country: e.target.value })}
                      placeholder="Country"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="clientNotes">Notes</label>
                  <textarea
                    id="clientNotes"
                    value={newClientData.notes || ''}
                    onChange={(e) => setNewClientData({ ...newClientData, notes: e.target.value })}
                    placeholder="Additional notes"
                    rows={2}
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="save-item-button"
                    onClick={handleCreateClient}
                  >
                    <UserCircle size={16} />
                    Create Client
                  </button>
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={() => setShowCreateClient(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Transport Details Section */}
          <div className="form-section">
            <h3><Truck size={20} /> Transport Details</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="transportCarName">Car Name</label>
                <div className="transport-search-container">
                  <input
                    type="text"
                    id="transportCarName"
                    value={transportSearchTerm}
                    onChange={(e) => handleTransportSearchChange(e.target.value)}
                    onFocus={() => setShowTransportDropdown(true)}
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
                              <small>{transport.phoneNumber}</small>
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
                {transportSearchTerm.trim() && !selectedTransportId && transportPhoneNumber.trim() && (
                  <button
                    type="button"
                    className="save-item-button"
                    onClick={handleCreateNewTransport}
                    style={{ marginTop: '8px' }}
                  >
                    Create New Transport
                  </button>
                )}
              </div>
            </div>
            <div className="form-row">
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
              <div className="form-group">
                <label htmlFor="transportNotes">Transport Notes</label>
                <input
                  type="text"
                  id="transportNotes"
                  value={transportNotes}
                  onChange={(e) => setTransportNotes(e.target.value)}
                  placeholder="Additional transport notes"
                />
              </div>
            </div>
          </div>

          {/* Products Section */}
          <div className="form-section">
            <div className="section-header">
              <h3><Package size={20} /> Products</h3>
              <button
                type="button"
                className="add-item-button"
                onClick={() => setShowAddItemForm(!showAddItemForm)}
              >
                <Plus size={20} />
                Add Product
              </button>
            </div>

            {/* Add Item Form */}
            {showAddItemForm && (
              <div className="add-item-form">
                <div className="form-row">
                  <div className="form-group material-search-group">
                    <label htmlFor="materialSearch">Product Name *</label>
                    <div className="material-search-container">
                      <input
                        type="text"
                        id="materialSearch"
                        value={materialSearchTerm}
                        onChange={handleMaterialSearchChange}
                        onFocus={() => setShowMaterialDropdown(true)}
                        placeholder="Search for finished product..."
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
                              No products found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
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
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="save-item-button"
                    onClick={handleAddItem}
                  >
                    Add Product
                  </button>
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={() => {
                      setShowAddItemForm(false);
                      setMaterialSearchTerm('');
                      setNewItem({ rawMaterialId: 0, quantity: 1 });
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Selected Items */}
            {items.length > 0 && (
              <div className="selected-items">
                <h4>Selected Products ({items.length})</h4>
                <div className="items-list">
                  {items.map((item, index) => (
                    <div key={index} className="item-card">
                      <div className="item-info">
                        <div className="item-name">{item.materialName}</div>
                        <div className="item-color">Color: {item.materialColor}</div>
                      </div>
                      <div className="item-details">
                        <div className="form-row">
                          <div className="form-group">
                            <label>Quantity</label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleUpdateItem(index, { quantity: parseFloat(e.target.value) || 0 })}
                              onWheel={handleWheel}
                              min="0"
                              step="0.01"
                            />
                          </div>
                          <div className="form-group">
                            <label>Unit</label>
                            <input
                              type="text"
                              value={item.quantityType}
                              disabled
                              className="disabled-field"
                            />
                          </div>
                        </div>
                        <div className="item-total">
                          Unit Price: ${item.unitPrice.toFixed(2)} | Total: ${item.totalPrice.toFixed(2)}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="remove-item-button"
                        onClick={() => handleRemoveItem(index)}
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
                  Total Items: {items.length} | Total Value: ${totalValue.toFixed(2)}
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
              disabled={isLoading || !selectedClientId || items.length === 0}
            >
              {isLoading ? 'Updating...' : 'Update Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditOrder;
