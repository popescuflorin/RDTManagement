import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation(['orders', 'common']);
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
      setError(err.response?.data?.message || t('common:messages.error', { defaultValue: 'Failed to load data' }));
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
      setError(t('messages.selectMaterial'));
      return;
    }

    const material = finishedProducts.find(m => m.id === newItem.rawMaterialId);
    if (!material) {
      setError(t('messages.materialNotFound', { defaultValue: 'Material not found' }));
      return;
    }

    // Check if material is already added
    if (items.some(item => item.rawMaterialId === newItem.rawMaterialId)) {
      setError(t('messages.materialExists'));
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
      setError(t('messages.clientNameRequired'));
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
      setError(err.response?.data?.message || t('messages.failedToCreateClient'));
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
      setError(t('messages.transportCarNameRequired'));
      return;
    }

    if (!transportPhoneNumber.trim()) {
      setError(t('messages.transportPhoneRequired'));
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
      setError(err.response?.data?.message || t('messages.failedToCreateTransport'));
    }
  };

  const filteredTransports = transports.filter(transport =>
    transport.carName.toLowerCase().includes(transportSearchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClientId) {
      setError(t('messages.selectClient'));
      return;
    }

    if (items.length === 0) {
      setError(t('messages.addItems'));
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
      setError(err.response?.data?.message || t('messages.orderUpdated', { defaultValue: 'Failed to update order' }));
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
              <h2>{t('editOrder')}</h2>
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
            <h3><FileText size={20} />{t('common:labels.information', { defaultValue: 'Information' })}</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="description">{t('common:labels.description')}</label>
                <input
                  type="text"
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('form.descriptionPlaceholder')}
                />
              </div>
              <div className="form-group">
                <label htmlFor="status">{t('common:labels.status')}</label>
                <input
                  type="text"
                  id="status"
                  value={order.statusLabel || t('status.draft')}
                  disabled
                  className="disabled-field"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="orderDate">{t('orderDate')}</label>
                <input
                  type="date"
                  id="orderDate"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  placeholder={t('form.orderDatePlaceholder', { defaultValue: 'Select order date' })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="expectedDeliveryDate">{t('expectedDeliveryDate')}</label>
                <input
                  type="date"
                  id="expectedDeliveryDate"
                  value={expectedDeliveryDate}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                  placeholder={t('form.expectedDeliveryDatePlaceholder', { defaultValue: 'Select expected delivery date' })}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="notes">{t('common:labels.notes')}</label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('common:labels.notes', { defaultValue: 'Additional notes' })}
                rows={3}
              />
            </div>
          </div>

          {/* Client Information Section */}
          <div className="form-section">
            <h3><UserCircle size={20} /> {t('client')}</h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="assignedUser">{t('assignedTo')}</label>
                <select
                  id="assignedUser"
                  value={selectedAssignedUserId || ''}
                  onChange={(e) => setSelectedAssignedUserId(e.target.value ? parseInt(e.target.value) : null)}
                  disabled={isLoading}
                >
                  <option value="">{t('common:labels.noAssignment')}</option>
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
                <label htmlFor="client">{t('client')} *</label>
                <select
                  id="client"
                  value={selectedClientId || 'none'}
                  onChange={(e) => handleClientChange(e.target.value)}
                  disabled={isLoading}
                >
                  <option value="none">{t('form.noClient')}</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                  <option value="new">+ {t('form.createNewClient')}</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="clientContact">{t('clientContact')}</label>
                <input
                  type="text"
                  id="clientContact"
                  value={clientContact}
                  onChange={(e) => setClientContact(e.target.value)}
                  disabled={isLoading}
                  placeholder={t('form.clientContactPlaceholder')}
                />
              </div>
            </div>

            {/* Create New Client Form */}
            {showCreateClient && (
              <div className="supplier-creation-form">
                <h4>{t('form.createNewClient')}</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="clientName">{t('form.clientName')} *</label>
                    <input
                      type="text"
                      id="clientName"
                      value={newClientData.name || ''}
                      onChange={(e) => setNewClientData({ ...newClientData, name: e.target.value })}
                      placeholder={t('form.clientNamePlaceholder')}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="clientContactPerson">{t('form.contactPerson')}</label>
                    <input
                      type="text"
                      id="clientContactPerson"
                      value={newClientData.contactPerson || ''}
                      onChange={(e) => setNewClientData({ ...newClientData, contactPerson: e.target.value })}
                      placeholder={t('form.contactPersonPlaceholder')}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="clientPhone">{t('common:labels.phone')}</label>
                    <input
                      type="text"
                      id="clientPhone"
                      value={newClientData.phone || ''}
                      onChange={(e) => setNewClientData({ ...newClientData, phone: e.target.value })}
                      placeholder={t('common:labels.phone', { defaultValue: 'Phone number' })}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="clientEmail">{t('common:labels.email')}</label>
                    <input
                      type="email"
                      id="clientEmail"
                      value={newClientData.email || ''}
                      onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })}
                      placeholder={t('common:labels.email', { defaultValue: 'Email address' })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="clientAddress">{t('common:labels.address')}</label>
                    <input
                      type="text"
                      id="clientAddress"
                      value={newClientData.address || ''}
                      onChange={(e) => setNewClientData({ ...newClientData, address: e.target.value })}
                      placeholder={t('common:labels.address', { defaultValue: 'Street address' })}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="clientCity">{t('common:labels.city')}</label>
                    <input
                      type="text"
                      id="clientCity"
                      value={newClientData.city || ''}
                      onChange={(e) => setNewClientData({ ...newClientData, city: e.target.value })}
                      placeholder={t('common:labels.city', { defaultValue: 'City' })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="clientPostalCode">{t('common:labels.postalCode')}</label>
                    <input
                      type="text"
                      id="clientPostalCode"
                      value={newClientData.postalCode || ''}
                      onChange={(e) => setNewClientData({ ...newClientData, postalCode: e.target.value })}
                      placeholder={t('common:labels.postalCode', { defaultValue: 'Postal code' })}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="clientCountry">{t('common:labels.country')}</label>
                    <input
                      type="text"
                      id="clientCountry"
                      value={newClientData.country || ''}
                      onChange={(e) => setNewClientData({ ...newClientData, country: e.target.value })}
                      placeholder={t('common:labels.country', { defaultValue: 'Country' })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="clientNotes">{t('common:labels.notes')}</label>
                  <textarea
                    id="clientNotes"
                    value={newClientData.notes || ''}
                    onChange={(e) => setNewClientData({ ...newClientData, notes: e.target.value })}
                    placeholder={t('common:labels.notes', { defaultValue: 'Additional notes' })}
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
                    {t('form.createClient')}
                  </button>
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={() => setShowCreateClient(false)}
                  >
                    {t('common:buttons.cancel')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Transport Details Section */}
          <div className="form-section">
            <h3><Truck size={20} /> {t('form.transportDetails')}</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="transportCarName">{t('form.carName')}</label>
                <div className="transport-search-container">
                  <input
                    type="text"
                    id="transportCarName"
                    value={transportSearchTerm}
                    onChange={(e) => handleTransportSearchChange(e.target.value)}
                    onFocus={() => setShowTransportDropdown(true)}
                    placeholder={t('transport.searchPlaceholder')}
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
                            <strong>{t('transport.createNew')}:</strong> {transportSearchTerm}
                            <small>{t('transport.enterPhoneNumber')}</small>
                          </div>
                        </div>
                      ) : (
                        <div className="material-option">
                          <div>
                            <small>{t('transport.startTyping')}</small>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="transportNumberPlate">{t('form.numberPlate')}</label>
                <input
                  type="text"
                  id="transportNumberPlate"
                  value={transportNumberPlate}
                  onChange={(e) => setTransportNumberPlate(e.target.value)}
                  placeholder={t('transport.numberPlatePlaceholder')}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="transportPhoneNumber">{t('form.phoneNumber')}</label>
                <input
                  type="tel"
                  id="transportPhoneNumber"
                  value={transportPhoneNumber}
                  onChange={(e) => setTransportPhoneNumber(e.target.value)}
                  placeholder={t('transport.phoneNumberPlaceholder')}
                />
                {transportSearchTerm.trim() && !selectedTransportId && transportPhoneNumber.trim() && (
                  <button
                    type="button"
                    className="save-item-button"
                    onClick={handleCreateNewTransport}
                    style={{ marginTop: '8px' }}
                  >
                    {t('form.createNewTransport')}
                  </button>
                )}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="transportDate">{t('form.transportDate')}</label>
                <input
                  type="date"
                  id="transportDate"
                  value={transportDate}
                  onChange={(e) => setTransportDate(e.target.value)}
                  placeholder={t('form.transportDatePlaceholder', { defaultValue: 'Select transport date' })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="transportNotes">{t('form.transportNotes')}</label>
                <input
                  type="text"
                  id="transportNotes"
                  value={transportNotes}
                  onChange={(e) => setTransportNotes(e.target.value)}
                  placeholder={t('transport.transportNotesPlaceholder')}
                />
              </div>
            </div>
          </div>

          {/* Products Section */}
          <div className="form-section">
            <div className="section-header">
              <h3><Package size={20} /> {t('form.products')}</h3>
              <button
                type="button"
                className="add-item-button"
                onClick={() => setShowAddItemForm(!showAddItemForm)}
              >
                <Plus size={20} />
                {t('form.addProduct')}
              </button>
            </div>

            {/* Add Item Form */}
            {showAddItemForm && (
              <div className="add-item-form">
                <div className="form-row">
                  <div className="form-group material-search-group">
                    <label htmlFor="materialSearch">{t('form.productName')} *</label>
                    <div className="material-search-container">
                      <input
                        type="text"
                        id="materialSearch"
                        value={materialSearchTerm}
                        onChange={handleMaterialSearchChange}
                        onFocus={() => setShowMaterialDropdown(true)}
                        placeholder={t('form.searchFinishedProducts')}
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
                                  {material.quantity} {material.quantityType} {t('form.available', { defaultValue: 'available' }).toLowerCase()}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="material-option no-results">
                              {t('form.noProductsFound', { defaultValue: 'No products found' })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="itemQuantity">{t('form.itemQuantity')} *</label>
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
                    {t('form.addProduct')}
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
                    {t('common:buttons.cancel')}
                  </button>
                </div>
              </div>
            )}

            {/* Selected Items */}
            {items.length > 0 && (
              <div className="selected-items">
                <h4>{t('form.selectedProducts')} ({items.length})</h4>
                <div className="items-list">
                  {items.map((item, index) => (
                    <div key={index} className="item-card">
                      <div className="item-info">
                        <div className="item-name">{item.materialName}</div>
                        <div className="item-color">{t('form.color')}: {item.materialColor}</div>
                      </div>
                      <div className="item-details">
                        <div className="form-row">
                          <div className="form-group">
                            <label>{t('form.itemQuantity')}</label>
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
                            <label>{t('form.unit', { defaultValue: 'Unit' })}</label>
                            <input
                              type="text"
                              value={item.quantityType}
                              disabled
                              className="disabled-field"
                            />
                          </div>
                        </div>
                        <div className="item-total">
                          {t('form.unitPrice')}: ${item.unitPrice.toFixed(2)} | {t('form.totalPrice')}: ${item.totalPrice.toFixed(2)}
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
                  {t('form.totalItems')}: {items.length} | {t('form.totalValue')}: ${totalValue.toFixed(2)}
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
              {t('common:buttons.cancel')}
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={isLoading || !selectedClientId || items.length === 0}
            >
              {isLoading ? t('form.updating') : t('form.updateOrder')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditOrder;
