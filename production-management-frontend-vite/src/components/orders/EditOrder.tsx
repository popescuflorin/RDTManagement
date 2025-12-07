import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { orderApi, inventoryApi, transportApi, clientApi, userApi } from '../../services/api';
import type { RawMaterial, UpdateOrderRequest, Transport, CreateTransportRequest, Client, CreateClientRequest, Order, User } from '../../types';
import { MaterialType } from '../../types';
import { Plus, Trash2, UserCircle, Truck, Package, FileText } from 'lucide-react';
import { Modal, Form, FormSection, FormRow, FormGroup, Label, Input, Textarea, Select } from '../atoms';
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

  const handleSubmit = async () => {
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

  if (!isOpen) return null;

  const totalValue = items.reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('editOrder', { defaultValue: 'Edit Order' })}
      titleIcon={Package}
      submitText={isLoading ? t('form.updating', { defaultValue: 'Updating...' }) : t('form.updateOrder', { defaultValue: 'Update Order' })}
      cancelText={t('common:buttons.cancel', { defaultValue: 'Cancel' })}
      submitVariant="primary"
      isSubmitting={isLoading || !selectedClientId || items.length === 0}
      onSubmit={handleSubmit}
      maxWidth="1000px"
      showCancel={true}
    >
      <Form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        {error && (
          <div className="error-message">
            {error}
            <button type="button" onClick={() => setError(null)}>×</button>
          </div>
        )}

        <FormSection title={t('common:labels.information', { defaultValue: 'Information' })} titleIcon={FileText}>
          <FormRow>
            <FormGroup>
              <Label htmlFor="description">{t('common:labels.description', { defaultValue: 'Description' })}</Label>
              <Input
                type="text"
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('form.descriptionPlaceholder', { defaultValue: 'Order description...' })}
              />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="status">{t('common:labels.status', { defaultValue: 'Status' })}</Label>
              <Input
                type="text"
                id="status"
                value={order.statusLabel || t('status.draft', { defaultValue: 'Draft' })}
                disabled
                className="disabled-field"
              />
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup>
              <Label htmlFor="orderDate">{t('orderDate', { defaultValue: 'Order Date' })}</Label>
              <Input
                type="date"
                id="orderDate"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
              />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="expectedDeliveryDate">{t('expectedDeliveryDate', { defaultValue: 'Expected Delivery Date' })}</Label>
              <Input
                type="date"
                id="expectedDeliveryDate"
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
              />
            </FormGroup>
          </FormRow>

          <FormGroup>
            <Label htmlFor="notes">{t('common:labels.notes', { defaultValue: 'Notes' })}</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('common:labels.notes', { defaultValue: 'Additional notes' })}
              rows={3}
            />
          </FormGroup>
        </FormSection>

        <FormSection title={t('client', { defaultValue: 'Client' })} titleIcon={UserCircle}>
          <FormRow>
            <FormGroup>
              <Label htmlFor="assignedUser">{t('assignedTo', { defaultValue: 'Assigned To' })}</Label>
              <Select
                id="assignedUser"
                value={selectedAssignedUserId || ''}
                onChange={(e) => setSelectedAssignedUserId(e.target.value ? parseInt(e.target.value) : null)}
                disabled={isLoading}
              >
                <option value="">{t('common:labels.noAssignment', { defaultValue: 'No Assignment' })}</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} ({user.username})
                  </option>
                ))}
              </Select>
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup>
              <Label htmlFor="client" required>{t('client', { defaultValue: 'Client' })}</Label>
              <Select
                id="client"
                value={selectedClientId || 'none'}
                onChange={(e) => handleClientChange(e.target.value)}
                disabled={isLoading}
              >
                <option value="none">{t('form.noClient', { defaultValue: 'No Client' })}</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
                <option value="new">+ {t('form.createNewClient', { defaultValue: 'Create New Client' })}</option>
              </Select>
            </FormGroup>
            <FormGroup>
              <Label htmlFor="clientContact">{t('clientContact', { defaultValue: 'Client Contact' })}</Label>
              <Input
                type="text"
                id="clientContact"
                value={clientContact}
                onChange={(e) => setClientContact(e.target.value)}
                disabled={isLoading}
                placeholder={t('form.clientContactPlaceholder', { defaultValue: 'Contact information' })}
              />
            </FormGroup>
          </FormRow>

          {/* Create New Client Form */}
          {showCreateClient && (
            <div className="supplier-creation-form" style={{ 
              marginTop: 'var(--space-lg)', 
              padding: 'var(--space-lg)', 
              border: '1px solid var(--border)', 
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--background-secondary)'
            }}>
              <h4 style={{ marginTop: 0, marginBottom: 'var(--space-md)' }}>{t('form.createNewClient', { defaultValue: 'Create New Client' })}</h4>
              <FormRow>
                <FormGroup>
                  <Label htmlFor="clientName" required>{t('form.clientName', { defaultValue: 'Client Name' })}</Label>
                  <Input
                    type="text"
                    id="clientName"
                    value={newClientData.name || ''}
                    onChange={(e) => setNewClientData({ ...newClientData, name: e.target.value })}
                    placeholder={t('form.clientNamePlaceholder', { defaultValue: 'Enter client name' })}
                  />
                </FormGroup>
                <FormGroup>
                  <Label htmlFor="clientContactPerson">{t('form.contactPerson', { defaultValue: 'Contact Person' })}</Label>
                  <Input
                    type="text"
                    id="clientContactPerson"
                    value={newClientData.contactPerson || ''}
                    onChange={(e) => setNewClientData({ ...newClientData, contactPerson: e.target.value })}
                    placeholder={t('form.contactPersonPlaceholder', { defaultValue: 'Contact person name' })}
                  />
                </FormGroup>
              </FormRow>

              <FormRow>
                <FormGroup>
                  <Label htmlFor="clientPhone">{t('common:labels.phone', { defaultValue: 'Phone' })}</Label>
                  <Input
                    type="tel"
                    id="clientPhone"
                    value={newClientData.phone || ''}
                    onChange={(e) => setNewClientData({ ...newClientData, phone: e.target.value })}
                    placeholder={t('common:labels.phone', { defaultValue: 'Phone number' })}
                  />
                </FormGroup>
                <FormGroup>
                  <Label htmlFor="clientEmail">{t('common:labels.email', { defaultValue: 'Email' })}</Label>
                  <Input
                    type="email"
                    id="clientEmail"
                    value={newClientData.email || ''}
                    onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })}
                    placeholder={t('common:labels.email', { defaultValue: 'Email address' })}
                  />
                </FormGroup>
              </FormRow>

              <FormRow>
                <FormGroup>
                  <Label htmlFor="clientAddress">{t('common:labels.address', { defaultValue: 'Address' })}</Label>
                  <Input
                    type="text"
                    id="clientAddress"
                    value={newClientData.address || ''}
                    onChange={(e) => setNewClientData({ ...newClientData, address: e.target.value })}
                    placeholder={t('common:labels.address', { defaultValue: 'Street address' })}
                  />
                </FormGroup>
                <FormGroup>
                  <Label htmlFor="clientCity">{t('common:labels.city', { defaultValue: 'City' })}</Label>
                  <Input
                    type="text"
                    id="clientCity"
                    value={newClientData.city || ''}
                    onChange={(e) => setNewClientData({ ...newClientData, city: e.target.value })}
                    placeholder={t('common:labels.city', { defaultValue: 'City' })}
                  />
                </FormGroup>
              </FormRow>

              <FormRow>
                <FormGroup>
                  <Label htmlFor="clientPostalCode">{t('common:labels.postalCode', { defaultValue: 'Postal Code' })}</Label>
                  <Input
                    type="text"
                    id="clientPostalCode"
                    value={newClientData.postalCode || ''}
                    onChange={(e) => setNewClientData({ ...newClientData, postalCode: e.target.value })}
                    placeholder={t('common:labels.postalCode', { defaultValue: 'Postal code' })}
                  />
                </FormGroup>
                <FormGroup>
                  <Label htmlFor="clientCountry">{t('common:labels.country', { defaultValue: 'Country' })}</Label>
                  <Input
                    type="text"
                    id="clientCountry"
                    value={newClientData.country || ''}
                    onChange={(e) => setNewClientData({ ...newClientData, country: e.target.value })}
                    placeholder={t('common:labels.country', { defaultValue: 'Country' })}
                  />
                </FormGroup>
              </FormRow>

              <FormGroup>
                <Label htmlFor="clientNotes">{t('common:labels.notes', { defaultValue: 'Notes' })}</Label>
                <Textarea
                  id="clientNotes"
                  value={newClientData.notes || ''}
                  onChange={(e) => setNewClientData({ ...newClientData, notes: e.target.value })}
                  placeholder={t('common:labels.notes', { defaultValue: 'Additional notes' })}
                  rows={2}
                />
              </FormGroup>

              <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleCreateClient}
                >
                  <UserCircle size={16} style={{ display: 'inline-block', marginRight: '8px', verticalAlign: 'middle' }} />
                  {t('form.createClient', { defaultValue: 'Create Client' })}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateClient(false)}
                >
                  {t('common:buttons.cancel', { defaultValue: 'Cancel' })}
                </button>
              </div>
            </div>
          )}
        </FormSection>

        <FormSection title={t('form.transportDetails', { defaultValue: 'Transport Details' })} titleIcon={Truck}>
          <FormRow>
            <FormGroup>
              <Label htmlFor="transportCarName">{t('form.carName', { defaultValue: 'Car Name' })}</Label>
              <div className="transport-search-container" style={{ position: 'relative' }}>
                <Input
                  type="text"
                  id="transportCarName"
                  value={transportSearchTerm}
                  onChange={(e) => handleTransportSearchChange(e.target.value)}
                  onFocus={() => setShowTransportDropdown(true)}
                  placeholder={t('transport.searchPlaceholder', { defaultValue: 'Search transport...' })}
                />
                {showTransportDropdown && (
                  <div className="material-dropdown" style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    marginTop: '4px'
                  }}>
                    {filteredTransports.length > 0 ? (
                      filteredTransports.map((transport) => (
                        <div
                          key={transport.id}
                          className="material-option"
                          onClick={() => handleTransportSelect(transport)}
                          style={{
                            padding: 'var(--space-sm) var(--space-md)',
                            cursor: 'pointer',
                            borderBottom: '1px solid var(--border)'
                          }}
                        >
                          <div>
                            <strong>{transport.carName}</strong>
                            {transport.numberPlate && <small> - {transport.numberPlate}</small>}
                            <small> {transport.phoneNumber}</small>
                          </div>
                        </div>
                      ))
                    ) : transportSearchTerm ? (
                      <div className="material-option material-option-create" style={{
                        padding: 'var(--space-sm) var(--space-md)',
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--border)'
                      }}>
                        <div>
                          <strong>{t('transport.createNew', { defaultValue: 'Create New' })}:</strong> {transportSearchTerm}
                          <small> {t('transport.enterPhoneNumber', { defaultValue: 'Enter phone number' })}</small>
                        </div>
                      </div>
                    ) : (
                      <div className="material-option" style={{
                        padding: 'var(--space-sm) var(--space-md)',
                        color: 'var(--text-secondary)'
                      }}>
                        <div>
                          <small>{t('transport.startTyping', { defaultValue: 'Start typing...' })}</small>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </FormGroup>
            <FormGroup>
              <Label htmlFor="transportNumberPlate">{t('form.numberPlate', { defaultValue: 'Number Plate' })}</Label>
              <Input
                type="text"
                id="transportNumberPlate"
                value={transportNumberPlate}
                onChange={(e) => setTransportNumberPlate(e.target.value)}
                placeholder={t('transport.numberPlatePlaceholder', { defaultValue: 'Number plate' })}
              />
            </FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup>
              <Label htmlFor="transportPhoneNumber">{t('form.phoneNumber', { defaultValue: 'Phone Number' })}</Label>
              <Input
                type="tel"
                id="transportPhoneNumber"
                value={transportPhoneNumber}
                onChange={(e) => setTransportPhoneNumber(e.target.value)}
                placeholder={t('transport.phoneNumberPlaceholder', { defaultValue: 'Phone number' })}
              />
              {transportSearchTerm.trim() && !selectedTransportId && transportPhoneNumber.trim() && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleCreateNewTransport}
                  style={{ marginTop: 'var(--space-sm)' }}
                >
                  {t('form.createNewTransport', { defaultValue: 'Create New Transport' })}
                </button>
              )}
            </FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup>
              <Label htmlFor="transportDate">{t('form.transportDate', { defaultValue: 'Transport Date' })}</Label>
              <Input
                type="date"
                id="transportDate"
                value={transportDate}
                onChange={(e) => setTransportDate(e.target.value)}
              />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="transportNotes">{t('form.transportNotes', { defaultValue: 'Transport Notes' })}</Label>
              <Input
                type="text"
                id="transportNotes"
                value={transportNotes}
                onChange={(e) => setTransportNotes(e.target.value)}
                placeholder={t('transport.transportNotesPlaceholder', { defaultValue: 'Transport notes' })}
              />
            </FormGroup>
          </FormRow>
        </FormSection>

        <FormSection title={t('form.products', { defaultValue: 'Products' })} titleIcon={Package}>
          {!showAddItemForm ? (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowAddItemForm(true)}
              disabled={isLoading}
            >
              <Plus size={16} style={{ display: 'inline-block', marginRight: '8px', verticalAlign: 'middle' }} />
              {t('form.addProduct', { defaultValue: 'Add Product' })}
            </button>
          ) : (
            <div className="add-item-form" style={{ 
              padding: 'var(--space-lg)', 
              border: '1px solid var(--border)', 
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--background-secondary)'
            }}>
              <FormGroup>
                <Label htmlFor="materialSearch" required>{t('form.productName', { defaultValue: 'Product Name' })}</Label>
                <div className="material-search-container" style={{ position: 'relative' }}>
                  <Input
                    type="text"
                    id="materialSearch"
                    value={materialSearchTerm}
                    onChange={handleMaterialSearchChange}
                    onFocus={() => setShowMaterialDropdown(true)}
                    placeholder={t('form.searchFinishedProducts', { defaultValue: 'Search finished products...' })}
                  />
                  {showMaterialDropdown && (
                    <div className="material-dropdown" style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      zIndex: 1000,
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-lg)',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      marginTop: '4px'
                    }}>
                      {filteredMaterials.length > 0 ? (
                        filteredMaterials.map(material => (
                          <div
                            key={material.id}
                            className="material-option"
                            onClick={() => handleMaterialSelect(material)}
                            style={{
                              padding: 'var(--space-sm) var(--space-md)',
                              cursor: 'pointer',
                              borderBottom: '1px solid var(--border)'
                            }}
                          >
                            <div className="material-option-main" style={{ fontWeight: 500 }}>
                              <span className="material-name">{material.name}</span>
                              <span className="material-color"> ({material.color})</span>
                            </div>
                            <div className="material-option-details" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                              {material.quantity} {material.quantityType} {t('form.available', { defaultValue: 'available' }).toLowerCase()}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="material-option no-results" style={{
                          padding: 'var(--space-sm) var(--space-md)',
                          color: 'var(--text-secondary)'
                        }}>
                          {t('form.noProductsFound', { defaultValue: 'No products found' })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </FormGroup>

              <FormRow>
                <FormGroup>
                  <Label htmlFor="itemQuantity" required>{t('form.itemQuantity', { defaultValue: 'Quantity' })}</Label>
                  <Input
                    type="number"
                    id="itemQuantity"
                    value={newItem.quantity || ''}
                    onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) || 0 })}
                    onWheel={handleWheel}
                    min="0"
                    step="0.01"
                    placeholder="0"
                  />
                </FormGroup>
                <FormGroup style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-sm)' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleAddItem}
                  >
                    {t('form.addProduct', { defaultValue: 'Add Product' })}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowAddItemForm(false);
                      setMaterialSearchTerm('');
                      setNewItem({ rawMaterialId: 0, quantity: 1 });
                    }}
                  >
                    {t('common:buttons.cancel', { defaultValue: 'Cancel' })}
                  </button>
                </FormGroup>
              </FormRow>
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
        </FormSection>

      </Form>
    </Modal>
  );
};

export default EditOrder;
