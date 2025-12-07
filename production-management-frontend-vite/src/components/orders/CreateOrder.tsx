import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { orderApi, inventoryApi, transportApi, clientApi, userApi } from '../../services/api';
import type { RawMaterial, CreateOrderRequest, Transport, CreateTransportRequest, Client, CreateClientRequest, User } from '../../types';
import { MaterialType } from '../../types';
import { Plus, Trash2, UserCircle, Truck, Package } from 'lucide-react';
import { Modal, Form, FormSection, FormRow, FormGroup, Label, Input, Textarea, Select, Table, ErrorMessage } from '../atoms';
import type { TableColumn } from '../atoms';

interface CreateOrderProps {
  isOpen: boolean;
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
  isOpen,
  onClose,
  onOrderCreated
}) => {
  const { t } = useTranslation(['orders', 'common']);
  const [finishedProducts, setFinishedProducts] = useState<RawMaterial[]>([]);
  const [transports, setTransports] = useState<Transport[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [itemError, setItemError] = useState<string | null>(null);

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
  const [showNewTransportForm, setShowNewTransportForm] = useState(false);
  const [transportNumberPlate, setTransportNumberPlate] = useState('');
  const [transportPhoneNumber, setTransportPhoneNumber] = useState('');
  const [transportDate, setTransportDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [transportNotes, setTransportNotes] = useState('');
  const [newTransportData, setNewTransportData] = useState<CreateTransportRequest>({
    carName: '',
    numberPlate: '',
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

      // Load users
      const usersResponse = await userApi.getAllUsers();
      setUsers(usersResponse.data);
      
      // Set default assigned user to current user
      const currentUser = localStorage.getItem('user');
      if (currentUser) {
        const userData = JSON.parse(currentUser);
        setSelectedAssignedUserId(userData.id);
      }
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
      setItemError(t('messages.selectMaterial'));
      return;
    }

    const material = finishedProducts.find(m => m.id === newItem.rawMaterialId);
    if (!material) {
      setItemError(t('messages.materialNotFound'));
      return;
    }

    // Check if material is already added
    if (items.some(item => item.rawMaterialId === newItem.rawMaterialId)) {
      setItemError(t('messages.materialExists'));
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
    setItemError(null);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
    setItemError(null);
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
      setError(t('messages.clientNameRequired', { defaultValue: 'Client name is required' }));
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
      setError(err.response?.data?.message || t('messages.failedToCreateClient', { defaultValue: 'Failed to create client' }));
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
        numberPlate: '',
        phoneNumber: ''
      });
      setTransportNumberPlate('');
    }
  };

  const handleTransportSelect = (transport: Transport) => {
    setSelectedTransportId(transport.id);
    setTransportSearchTerm(transport.carName);
    // Ensure number plate is set correctly (handle null, undefined, or empty string)
    setTransportNumberPlate(transport.numberPlate ?? '');
    setTransportPhoneNumber(transport.phoneNumber);
    setShowTransportDropdown(false);
    setShowNewTransportForm(false);
  };

  const handleCreateNewTransport = async () => {
    if (!newTransportData.carName.trim()) {
      setError(t('messages.transportCarNameRequired', { defaultValue: 'Transport car name is required' }));
      return;
    }

    if (!newTransportData.phoneNumber.trim()) {
      setError(t('messages.transportPhoneRequired', { defaultValue: 'Transport phone number is required' }));
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
      setError(err.response?.data?.message || t('messages.failedToCreateTransport', { defaultValue: 'Failed to create transport' }));
    } finally {
      setIsLoading(false);
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
      setItemError(t('messages.addItems'));
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      if (!selectedClientId) {
        setError(t('messages.selectClient'));
        return;
      }

      let transportId = selectedTransportId;

      // If transport name is entered but not selected, create new transport
      if (transportSearchTerm.trim() && !selectedTransportId && showNewTransportForm && newTransportData.carName.trim() && newTransportData.phoneNumber.trim()) {
        const response = await transportApi.createTransport(newTransportData);
        transportId = response.data.id;
      } else if (transportSearchTerm.trim() && !selectedTransportId) {
        setError(t('messages.selectTransport', { defaultValue: 'Please select an existing transport or fill in the new transport form' }));
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
        assignedToUserId: selectedAssignedUserId || undefined,
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
      setError(err.response?.data?.message || t('messages.orderCreated', { defaultValue: 'Failed to create order' }));
    } finally {
      setIsLoading(false);
    }
  };

  const totalValue = items.reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('createOrder', { defaultValue: 'Create Order' })}
      titleIcon={Package}
      submitText={isLoading ? t('form.creating', { defaultValue: 'Creating...' }) : t('form.createOrder', { defaultValue: 'Create Order' })}
      cancelText={t('common:buttons.cancel', { defaultValue: 'Cancel' })}
      submitVariant="primary"
      isSubmitting={isLoading || items.length === 0}
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
                <div className="search-input-wrapper" style={{ position: 'relative' }}>
                  <Input
                    type="text"
                    id="transportCarName"
                    value={transportSearchTerm}
                    onChange={handleTransportSearchChange}
                    onFocus={() => setShowTransportDropdown(true)}
                    disabled={isLoading}
                    placeholder={t('transport.searchPlaceholder', { defaultValue: 'Search transport...' })}
                  />
                  {showTransportDropdown && (
                    <div className="dropdown-menu" style={{
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
                        filteredTransports.map(transport => (
                          <div
                            key={transport.id}
                            className="dropdown-item"
                            onClick={() => handleTransportSelect(transport)}
                            style={{
                              padding: 'var(--space-sm) var(--space-md)',
                              cursor: 'pointer',
                              borderBottom: '1px solid var(--border)'
                            }}
                          >
                            <div className="dropdown-item-name" style={{ fontWeight: 500 }}>{transport.carName}{transport.numberPlate ? ` - ${transport.numberPlate}` : ''}</div>
                            <div className="dropdown-item-detail" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{transport.phoneNumber}</div>
                          </div>
                        ))
                      ) : transportSearchTerm ? (
                        <div className="dropdown-item" style={{
                          padding: 'var(--space-sm) var(--space-md)',
                          cursor: 'pointer',
                          borderBottom: '1px solid var(--border)'
                        }}>
                          <div className="dropdown-item-name" style={{ fontWeight: 500 }}>{t('transport.createNew', { defaultValue: 'Create New' })}: {transportSearchTerm}</div>
                          <div className="dropdown-item-detail" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{t('transport.enterPhoneNumber', { defaultValue: 'Enter phone number' })}</div>
                        </div>
                      ) : (
                        <div className="dropdown-item" style={{
                          padding: 'var(--space-sm) var(--space-md)',
                          color: 'var(--text-secondary)'
                        }}>
                          <div className="dropdown-item-name">{t('transport.startTyping', { defaultValue: 'Start typing...' })}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </FormGroup>
            <FormGroup>
              <Label htmlFor="transportNumberPlate">{t('form.numberPlate', { defaultValue: 'Number Plate' })}</Label>
              <Input
                type="text"
                id="transportNumberPlate"
                value={transportNumberPlate}
                onChange={(e) => setTransportNumberPlate(e.target.value)}
                disabled={isLoading}
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
                disabled={isLoading}
                placeholder={t('transport.phoneNumberPlaceholder', { defaultValue: 'Phone number' })}
              />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="transportDate">{t('form.transportDate', { defaultValue: 'Transport Date' })}</Label>
              <Input
                type="date"
                id="transportDate"
                value={transportDate}
                onChange={(e) => setTransportDate(e.target.value)}
                disabled={isLoading}
              />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="transportNotes">{t('form.transportNotes', { defaultValue: 'Transport Notes' })}</Label>
              <Input
                type="text"
                id="transportNotes"
                value={transportNotes}
                onChange={(e) => setTransportNotes(e.target.value)}
                disabled={isLoading}
                placeholder={t('transport.transportNotesPlaceholder', { defaultValue: 'Transport notes' })}
              />
            </FormGroup>
          </FormRow>

            {transportSearchTerm && !selectedTransportId && transportPhoneNumber && (
              <div style={{ marginTop: 'var(--space-md)' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowNewTransportForm(true);
                    setNewTransportData({
                      carName: transportSearchTerm.trim(),
                      numberPlate: transportNumberPlate.trim() || undefined,
                      phoneNumber: transportPhoneNumber.trim()
                    });
                  }}
                  disabled={isLoading}
                >
                  <Plus size={16} />
                  {t('form.createNewTransport')} "{transportSearchTerm.trim()}"
                </button>
              </div>
            )}

          {showNewTransportForm && (
            <div className="add-item-form" style={{ 
              marginTop: 'var(--space-lg)', 
              padding: 'var(--space-lg)', 
              border: '1px solid var(--border)', 
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--background-secondary)'
            }}>
              <FormRow>
                <FormGroup>
                  <Label htmlFor="newTransportCarName" required>{t('form.carName', { defaultValue: 'Car Name' })}</Label>
                  <Input
                    type="text"
                    id="newTransportCarName"
                    value={newTransportData.carName}
                    onChange={(e) => setNewTransportData({ ...newTransportData, carName: e.target.value })}
                    disabled={isLoading}
                    placeholder={t('transport.carNamePlaceholder', { defaultValue: 'Enter car name' })}
                  />
                </FormGroup>
                <FormGroup>
                  <Label htmlFor="newTransportNumberPlate">{t('form.numberPlate', { defaultValue: 'Number Plate' })}</Label>
                  <Input
                    type="text"
                    id="newTransportNumberPlate"
                    value={newTransportData.numberPlate || ''}
                    onChange={(e) => setNewTransportData({ ...newTransportData, numberPlate: e.target.value })}
                    disabled={isLoading}
                    placeholder={t('transport.numberPlatePlaceholder', { defaultValue: 'Number plate' })}
                  />
                </FormGroup>
              </FormRow>
              <FormRow>
                <FormGroup>
                  <Label htmlFor="newTransportPhoneNumber" required>{t('form.phoneNumber', { defaultValue: 'Phone Number' })}</Label>
                  <Input
                    type="tel"
                    id="newTransportPhoneNumber"
                    value={newTransportData.phoneNumber}
                    onChange={(e) => setNewTransportData({ ...newTransportData, phoneNumber: e.target.value })}
                    disabled={isLoading}
                    placeholder={t('transport.phoneNumberPlaceholder', { defaultValue: 'Phone number' })}
                  />
                </FormGroup>
              </FormRow>

              <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleCreateNewTransport}
                  disabled={isLoading || !newTransportData.carName.trim() || !newTransportData.phoneNumber.trim()}
                >
                  <Plus size={16} style={{ display: 'inline-block', marginRight: '8px', verticalAlign: 'middle' }} />
                  {t('form.createNewTransport', { defaultValue: 'Create New Transport' })}
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
                  {t('common:buttons.cancel', { defaultValue: 'Cancel' })}
                </button>
              </div>
            </div>
          )}
        </FormSection>

        <FormSection title={t('form.orderDetails', { defaultValue: 'Order Details' })} titleIcon={Package}>
          <FormRow>
            <FormGroup>
              <Label htmlFor="orderDate" required>{t('orderDate', { defaultValue: 'Order Date' })}</Label>
              <Input
                type="date"
                id="orderDate"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                required
                disabled={isLoading}
              />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="expectedDeliveryDate">{t('expectedDeliveryDate', { defaultValue: 'Expected Delivery Date' })}</Label>
              <Input
                type="date"
                id="expectedDeliveryDate"
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                disabled={isLoading}
              />
            </FormGroup>
          </FormRow>

          <FormGroup>
            <Label htmlFor="description">{t('common:labels.description', { defaultValue: 'Description' })}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              disabled={isLoading}
              placeholder={t('form.descriptionPlaceholder', { defaultValue: 'Order description...' })}
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="notes">{t('common:labels.notes', { defaultValue: 'Notes' })}</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              disabled={isLoading}
              placeholder={t('common:labels.notes', { defaultValue: 'Additional notes...' })}
            />
          </FormGroup>
        </FormSection>

        <FormSection title={t('form.orderItems', { defaultValue: 'Order Items' })} titleIcon={Package}>
          {itemError && (
            <ErrorMessage
              message={itemError}
              onDismiss={() => setItemError(null)}
            />
          )}
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
                <Label htmlFor="materialSearch">{t('form.selectProduct', { defaultValue: 'Select Product' })}</Label>
                <div className="search-input-wrapper" style={{ position: 'relative' }}>
                  <Input
                    type="text"
                    id="materialSearch"
                    value={materialSearchTerm}
                    onChange={handleMaterialSearchChange}
                    onFocus={() => setShowMaterialDropdown(true)}
                    disabled={isLoading}
                    placeholder={t('form.searchFinishedProducts', { defaultValue: 'Search finished products...' })}
                  />
                  {showMaterialDropdown && filteredMaterials.length > 0 && (
                    <div className="dropdown-menu" style={{
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
                      {filteredMaterials.map(material => (
                        <div
                          key={material.id}
                          className="dropdown-item"
                          onClick={() => handleMaterialSelect(material)}
                          style={{
                            padding: 'var(--space-sm) var(--space-md)',
                            cursor: 'pointer',
                            borderBottom: '1px solid var(--border)'
                          }}
                        >
                          <div className="dropdown-item-name" style={{ fontWeight: 500 }}>
                            {material.name} ({material.color})
                          </div>
                          <div className="dropdown-item-detail" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                            {t('form.available', { defaultValue: 'Available' })}: {material.quantity} {material.quantityType}
                          </div>
                        </div>
                      ))}
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
                    value={newItem.quantity}
                    onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                    onWheel={handleWheel}
                    min="0.01"
                    step="0.01"
                    required
                    disabled={isLoading}
                  />
                </FormGroup>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', justifyContent: 'center' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleAddItem}
                    disabled={isLoading}
                  >
                    <Plus size={16} style={{ display: 'inline-block', marginRight: '8px', verticalAlign: 'middle' }} />
                    {t('common:buttons.add', { defaultValue: 'Add' })}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowAddItemForm(false);
                      setMaterialSearchTerm('');
                      setNewItem({ rawMaterialId: 0, quantity: 1 });
                      setItemError(null);
                    }}
                    disabled={isLoading}
                  >
                    {t('common:buttons.cancel', { defaultValue: 'Cancel' })}
                  </button>
                </div>
              </FormRow>
            </div>
          )}

{items.length > 0 && (
              <>
                <Table
                  columns={[
                    {
                      key: 'materialName',
                      label: t('form.product'),
                      cellClassName: 'order-item-name'
                    },
                    {
                      key: 'materialColor',
                      label: t('form.color'),
                      cellClassName: 'order-item-color'
                    },
                    {
                      key: 'quantity',
                      label: t('form.itemQuantity'),
                      render: (_, item) => (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItemQuantity(item.id, parseFloat(e.target.value) || 0)}
                            onWheel={handleWheel}
                            min="0.01"
                            step="0.01"
                            disabled={isLoading}
                            style={{ width: '100px' }}
                          />
                          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                            {item.quantityType}
                          </span>
                        </div>
                      ),
                      cellClassName: 'order-item-quantity'
                    },
                    {
                      key: 'unitPrice',
                      label: t('form.unitPrice'),
                      align: 'right',
                      render: (_, item) => `$${item.unitPrice.toFixed(2)}`,
                      cellClassName: 'order-item-unit-price'
                    },
                    {
                      key: 'totalPrice',
                      label: t('form.totalPrice'),
                      align: 'right',
                      render: (_, item) => (
                        <span style={{ fontWeight: 600, color: 'var(--primary-600)' }}>
                          ${item.totalPrice.toFixed(2)}
                        </span>
                      ),
                      cellClassName: 'order-item-total-price'
                    },
                    {
                      key: 'actions',
                      label: t('common:labels.actions'),
                      align: 'center',
                      render: (_, item) => (
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={isLoading}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      ),
                      cellClassName: 'order-item-actions'
                    }
                  ] as TableColumn<OrderItem>[]}
                  data={items}
                  getRowKey={(item) => item.id}
                  showContainer={false}
                  tableClassName="order-items-table"
                />
                <div style={{ 
                  marginTop: 'var(--space-lg)', 
                  padding: 'var(--space-md)', 
                  display: 'flex', 
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: 'var(--space-md)',
                  borderTop: '1px solid var(--border)',
                  backgroundColor: 'var(--background-secondary)'
                }}>
                  <span style={{ fontWeight: 600, fontSize: 'var(--text-base)' }}>
                    {t('form.totalValue')}:
                  </span>
                  <span style={{ 
                    fontWeight: 700, 
                    fontSize: 'var(--text-lg)',
                    color: 'var(--primary-600)' 
                  }}>
                    ${totalValue.toFixed(2)}
                  </span>
                </div>
              </>
            )}
        </FormSection>
      </Form>
    </Modal>
  );
};

export default CreateOrder;

