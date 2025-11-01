import React, { useState, useEffect } from 'react';
import { orderApi, inventoryApi, transportApi, clientApi } from '../../services/api';
import type { RawMaterial, CreateOrderRequest, Transport, CreateTransportRequest, Client, CreateClientRequest } from '../../types';
import { MaterialType } from '../../types';
import { X, Plus, Trash2, UserCircle, Truck, Package } from 'lucide-react';
import './CreateOrder.css';

interface CreateOrderProps {
  onClose: () => void;
  onOrderCreated: () => void;
}

interface OrderItem {
  id: string;
  rawMaterialId: number;
  materialName: string;
  materialColor: string;
  quantityType: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

const CreateOrder: React.FC<CreateOrderProps> = ({
  onClose,
  onOrderCreated
}) => {
  const [finishedProducts, setFinishedProducts] = useState<RawMaterial[]>([]);
  const [transports, setTransports] = useState<Transport[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form data
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [orderDate, setOrderDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');

  // Client details
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [clientContact, setClientContact] = useState('');
  const [showCreateClient, setShowCreateClient] = useState(false);
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
  const [showNewTransportForm, setShowNewTransportForm] = useState(false);
  const [transportPhoneNumber, setTransportPhoneNumber] = useState('');
  const [transportDate, setTransportDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [transportNotes, setTransportNotes] = useState('');
  const [newTransportData, setNewTransportData] = useState<CreateTransportRequest>({
    carName: '',
    phoneNumber: ''
  });

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
    loadData();
  }, []);

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
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load data');
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
      id: Date.now().toString(),
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
    setShowAddItemForm(false);
    setError(null);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleUpdateItemQuantity = (id: string, quantity: number) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    // Allow updating quantity without restriction for future fulfillment
    setItems(items.map(i =>
      i.id === id
        ? { ...i, quantity, totalPrice: i.unitPrice * quantity }
        : i
    ));
    setError(null);
  };

  const filteredMaterials = finishedProducts.filter(material =>
    material.name.toLowerCase().includes(materialSearchTerm.toLowerCase()) ||
    material.color.toLowerCase().includes(materialSearchTerm.toLowerCase())
  );

  const handleMaterialSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMaterialSearchTerm(value);
    setShowMaterialDropdown(true);
  };

  const handleMaterialSelect = (material: RawMaterial) => {
    setNewItem(prev => ({ ...prev, rawMaterialId: material.id }));
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
      
      // Find the selected client and populate contact field
      const selectedClient = clients.find(c => c.id === clientIdNum);
      if (selectedClient) {
        // Use contact person, phone, or email as contact info
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
        // Use contact person, phone, or email as contact info
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

  const handleTransportSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTransportSearchTerm(value);
    setShowTransportDropdown(true);
    
    if (!value.trim()) {
      setSelectedTransportId(null);
      setShowNewTransportForm(false);
      setNewTransportData({
        carName: '',
        phoneNumber: ''
      });
    }
  };

  const handleTransportSelect = (transport: Transport) => {
    setSelectedTransportId(transport.id);
    setTransportSearchTerm(transport.carName);
    setTransportPhoneNumber(transport.phoneNumber);
    setShowTransportDropdown(false);
    setShowNewTransportForm(false);
  };

  const handleCreateNewTransport = async () => {
    if (!newTransportData.carName.trim()) {
      setError('Transport car name is required');
      return;
    }

    if (!newTransportData.phoneNumber.trim()) {
      setError('Transport phone number is required');
      return;
    }

    try {
      setIsLoading(true);
      const response = await transportApi.createTransport(newTransportData);
      const createdTransport = response.data;
      
      // Refresh transports list
      const transportsResponse = await transportApi.getAllTransports();
      setTransports(transportsResponse.data);
      
      // Select the newly created transport
      setSelectedTransportId(createdTransport.id);
      setTransportSearchTerm(createdTransport.carName);
      setShowNewTransportForm(false);
      setShowTransportDropdown(false);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create transport');
    } finally {
      setIsLoading(false);
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

      if (!selectedClientId) {
        setError('Please select a client');
        return;
      }

      let transportId = selectedTransportId;

      // If transport name is entered but not selected, create new transport
      if (transportSearchTerm.trim() && !selectedTransportId && showNewTransportForm && newTransportData.carName.trim() && newTransportData.phoneNumber.trim()) {
        const response = await transportApi.createTransport(newTransportData);
        transportId = response.data.id;
      } else if (transportSearchTerm.trim() && !selectedTransportId) {
        setError('Please select an existing transport or fill in the new transport form');
        return;
      }

      const createRequest: CreateOrderRequest = {
        clientId: selectedClientId,
        description: description.trim() || undefined,
        notes: notes.trim() || undefined,
        orderDate,
        expectedDeliveryDate: expectedDeliveryDate || undefined,
        transportId: transportId || undefined,
        transportDate: transportDate || undefined,
        transportNotes: transportNotes.trim() || undefined,
        orderMaterials: items.map(item => ({
          rawMaterialId: item.rawMaterialId,
          quantity: item.quantity
        }))
      };

      await orderApi.createOrder(createRequest);
      onOrderCreated();
      onClose();
    } catch (err: any) {
      console.error('Error creating order:', err);
      setError(err.response?.data?.message || 'Failed to create order');
    } finally {
      setIsLoading(false);
    }
  };

  const totalValue = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const handleBackdropClick = (e: React.MouseEvent) => {
    // Prevent closing on backdrop click - only allow closing via buttons
    e.stopPropagation();
  };
  return (
    <div className="create-order-overlay" onClick={handleBackdropClick}>
      <div className="create-order-modal" onClick={(e) => e.stopPropagation()}>
        <div className="create-order-header">
          <div className="header-content">
            <div className="header-title">
              <Package className="header-icon" />
              <h2>Create New Order</h2>
            </div>
            <button className="close-button" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="create-order-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Client Information Section */}
          <div className="form-section">
            <h3><UserCircle size={20} /> Client</h3>

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

          {/* Transport Section */}
          <div className="form-section">
            <div className="section-header">
              <Truck className="section-icon" />
              <h3>Transport Details</h3>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="transportCarName">Car Name</label>
                <div className="transport-search-container">
                  <div className="search-input-wrapper">
                    <input
                      type="text"
                      id="transportCarName"
                      value={transportSearchTerm}
                      onChange={handleTransportSearchChange}
                      onFocus={() => setShowTransportDropdown(true)}
                      disabled={isLoading}
                      placeholder="Search or enter car/vehicle name"
                    />
                    {showTransportDropdown && transportSearchTerm && (
                      <div className="dropdown-menu">
                        {filteredTransports.length > 0 ? (
                          filteredTransports.map(transport => (
                            <div
                              key={transport.id}
                              className="dropdown-item"
                              onClick={() => handleTransportSelect(transport)}
                            >
                              <div className="dropdown-item-name">{transport.carName}</div>
                              <div className="dropdown-item-detail">{transport.phoneNumber}</div>
                            </div>
                          ))
                        ) : (
                          <div className="dropdown-item">
                            <div className="dropdown-item-name">Create new transport: {transportSearchTerm}</div>
                            <div className="dropdown-item-detail">Enter phone number and submit to create</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="transportPhoneNumber">Phone Number</label>
                <input
                  type="tel"
                  id="transportPhoneNumber"
                  value={transportPhoneNumber}
                  onChange={(e) => setTransportPhoneNumber(e.target.value)}
                  disabled={isLoading}
                  placeholder="Enter phone number"
                />
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
                  disabled={isLoading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="transportNotes">Transport Notes</label>
                <input
                  type="text"
                  id="transportNotes"
                  value={transportNotes}
                  onChange={(e) => setTransportNotes(e.target.value)}
                  disabled={isLoading}
                  placeholder="Additional transport notes"
                />
              </div>
            </div>

            {transportSearchTerm && !selectedTransportId && transportPhoneNumber && (
              <div style={{ marginTop: 'var(--space-md)' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowNewTransportForm(true);
                    setNewTransportData({
                      carName: transportSearchTerm.trim(),
                      phoneNumber: transportPhoneNumber.trim()
                    });
                  }}
                  disabled={isLoading}
                >
                  <Plus size={16} />
                  Create New Transport "{transportSearchTerm.trim()}"
                </button>
              </div>
            )}

            {showNewTransportForm && (
              <div className="add-item-form" style={{ marginTop: 'var(--space-lg)' }}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="newTransportCarName">Car Name *</label>
                    <input
                      type="text"
                      id="newTransportCarName"
                      value={newTransportData.carName}
                      onChange={(e) => setNewTransportData({ ...newTransportData, carName: e.target.value })}
                      disabled={isLoading}
                      placeholder="Enter car name"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="newTransportPhoneNumber">Phone Number *</label>
                    <input
                      type="text"
                      id="newTransportPhoneNumber"
                      value={newTransportData.phoneNumber}
                      onChange={(e) => setNewTransportData({ ...newTransportData, phoneNumber: e.target.value })}
                      disabled={isLoading}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleCreateNewTransport}
                      disabled={isLoading || !newTransportData.carName.trim() || !newTransportData.phoneNumber.trim()}
                    >
                      <Plus size={16} />
                      Create Transport
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowNewTransportForm(false);
                        setNewTransportData({
                          carName: '',
                          phoneNumber: ''
                        });
                      }}
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Order Details Section */}
          <div className="form-section">
            <div className="section-header">
              <Package className="section-icon" />
              <h3>Order Details</h3>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="orderDate">Order Date *</label>
                <input
                  type="date"
                  id="orderDate"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="expectedDeliveryDate">Expected Delivery Date</label>
                <input
                  type="date"
                  id="expectedDeliveryDate"
                  value={expectedDeliveryDate}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                disabled={isLoading}
                placeholder="Order description..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                disabled={isLoading}
                placeholder="Additional notes..."
              />
            </div>
          </div>

          {/* Order Items Section */}
          <div className="form-section">
            <div className="section-header">
              <Package className="section-icon" />
              <h3>Order Items (Finished Products)</h3>
            </div>

            {!showAddItemForm ? (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowAddItemForm(true)}
                disabled={isLoading}
              >
                <Plus size={16} />
                Add Finished Product
              </button>
            ) : (
              <div className="add-item-form">
                <div className="form-group">
                  <label htmlFor="materialSearch">Select Finished Product</label>
                  <div className="search-input-wrapper">
                    <input
                      type="text"
                      id="materialSearch"
                      value={materialSearchTerm}
                      onChange={handleMaterialSearchChange}
                      onFocus={() => setShowMaterialDropdown(true)}
                      disabled={isLoading}
                      placeholder="Search finished products..."
                    />
                    {showMaterialDropdown && filteredMaterials.length > 0 && (
                      <div className="dropdown-menu">
                        {filteredMaterials.map(material => (
                          <div
                            key={material.id}
                            className="dropdown-item"
                            onClick={() => handleMaterialSelect(material)}
                          >
                            <div className="dropdown-item-name">
                              {material.name} ({material.color})
                            </div>
                            <div className="dropdown-item-detail">
                              Available: {material.quantity} {material.quantityType}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="itemQuantity">Quantity *</label>
                    <input
                      type="number"
                      id="itemQuantity"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                      min="0.01"
                      step="0.01"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleAddItem}
                      disabled={isLoading}
                    >
                      <Plus size={16} />
                      Add
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowAddItemForm(false);
                        setMaterialSearchTerm('');
                        setNewItem({ rawMaterialId: 0, quantity: 1 });
                      }}
                      disabled={isLoading}
                      style={{ marginLeft: '8px' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {items.length > 0 && (
              <div className="items-table">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Color</th>
                      <th>Quantity</th>
                      <th>Unit Price</th>
                      <th>Total Price</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item.id}>
                        <td>{item.materialName}</td>
                        <td>{item.materialColor}</td>
                        <td>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItemQuantity(item.id, parseFloat(e.target.value) || 0)}
                            min="0.01"
                            step="0.01"
                            className="quantity-input"
                            disabled={isLoading}
                          />
                          <span className="quantity-type">{item.quantityType}</span>
                        </td>
                        <td>${item.unitPrice.toFixed(2)}</td>
                        <td>${item.totalPrice.toFixed(2)}</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={isLoading}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'right', fontWeight: 600 }}>
                        Total Value:
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--primary-600)' }}>
                        ${totalValue.toFixed(2)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || items.length === 0}
            >
              {isLoading ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOrder;

