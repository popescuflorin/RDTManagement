import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { acquisitionApi, inventoryApi, supplierApi, transportApi, userApi } from '../../services/api';
import type { RawMaterial, CreateAcquisitionRequest, Supplier, CreateSupplierRequest, Transport, CreateTransportRequest, User } from '../../types';
import { AcquisitionType, MaterialType } from '../../types';
import { Plus, Trash2, Building2, FileText, Truck, Package, UserCircle } from 'lucide-react';
import { Modal, Form, FormSection, FormRow, FormGroup, Label, Input, Textarea, Select, ErrorMessage, DropdownMenu } from '../atoms';

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
  const { t } = useTranslation(['acquisitions', 'common']);
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
      setError(t('form.messages.failedToLoadMaterials'));
    }
  };

  const loadSuppliers = async () => {
    try {
      const response = await supplierApi.getAllSuppliers();
      setSuppliers(response.data);
    } catch (err: any) {
      setError(t('form.messages.failedToLoadSuppliers'));
    }
  };

  const loadTransports = async () => {
    try {
      const response = await transportApi.getAllTransports();
      setTransports(response.data);
    } catch (err: any) {
      setError(t('form.messages.failedToLoadTransports'));
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
      setError(t('form.messages.failedToLoadUsers'));
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
      setMaterialError(t('form.messages.fillRequiredFields'));
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
      setError(t('form.messages.supplierNameRequired'));
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
      setError(err.response?.data?.message || t('form.messages.failedToCreateSupplier'));
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

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError(t('form.messages.titleRequired'));
      return;
    }

    if (items.length === 0) {
      setError(t('form.messages.atLeastOneItem'));
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
      resetForm();
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || t('form.messages.failedToCreateAcquisition'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('form.createTitle')}
      titleIcon={FileText}
      submitText={isLoading ? t('form.buttons.creating') : t('form.buttons.create')}
      cancelText={t('form.buttons.cancel')}
      submitVariant="primary"
      isSubmitting={isLoading}
      onSubmit={handleSubmit}
      maxWidth="900px"
      closeOnBackdropClick={false}
    >
      <Form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        {error && (
          <ErrorMessage
            message={error}
            onDismiss={() => setError(null)}
          />
        )}

          {/* Basic Information */}
          <FormSection title={t('form.sections.information')} titleIcon={FileText}>
            <FormRow>
              <FormGroup>
                <Label htmlFor="title">{t('form.fields.details')} *</Label>
                <Input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder={t('form.placeholders.enterTitle')}
                />
              </FormGroup>
              <FormGroup>
                <Label htmlFor="type">{t('form.fields.type')}</Label>
                <Select
                  id="type"
                  value={acquisitionType.toString()}
                  onChange={(e) => setAcquisitionType(Number(e.target.value) as AcquisitionType)}
                >
                  <option value={AcquisitionType.RawMaterials.toString()}>{t('type.rawMaterials')}</option>
                  <option value={AcquisitionType.RecyclableMaterials.toString()}>{t('type.recyclableMaterials')}</option>
                </Select>
              </FormGroup>
            </FormRow>

            <FormRow>
              <FormGroup>
                <Label htmlFor="assignedUser">
                  <UserCircle size={16} style={{display: 'inline', marginRight: '4px'}} /> {t('form.fields.assignedUser')}
                </Label>
                <Select
                  id="assignedUser"
                  value={selectedAssignedUserId?.toString() || ''}
                  onChange={(e) => setSelectedAssignedUserId(e.target.value ? parseInt(e.target.value) : null)}
                >
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} ({user.username})
                    </option>
                  ))}
                </Select>
              </FormGroup>
            </FormRow>

            <FormGroup>
              <Label htmlFor="description">{t('form.fields.description')}</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('form.placeholders.enterDescription')}
                rows={3}
              />
            </FormGroup>

            <FormRow>
              <FormGroup>
                <Label htmlFor="dueDate">{t('form.fields.dueDate')}</Label>
                <Input
                  type="date"
                  id="dueDate"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  placeholder={t('form.placeholders.selectDueDate')}
                />
              </FormGroup>
              <FormGroup>
                <Label htmlFor="notes">{t('form.fields.notes')}</Label>
                <Input
                  type="text"
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('form.placeholders.additionalNotes')}
                />
              </FormGroup>
            </FormRow>
          </FormSection>

          {/* Transport Details Section */}
          <FormSection title={t('form.sections.transportDetails')} titleIcon={Truck}>
            <FormRow>
              <FormGroup>
                <Label htmlFor="transportCarName">{t('form.fields.carName')}</Label>
                <div className="material-search-container">
                  <Input
                    type="text"
                    id="transportCarName"
                    value={transportSearchTerm}
                    onChange={(e) => handleTransportSearchChange(e.target.value)}
                    onFocus={handleTransportInputFocus}
                    placeholder={t('form.placeholders.searchOrEnterCar')}
                  />
                  <DropdownMenu<Transport>
                    isOpen={showTransportDropdown}
                    items={filteredTransports.map(transport => ({
                      id: transport.id,
                      data: transport,
                      label: `${transport.carName}${transport.numberPlate ? ` - ${transport.numberPlate}` : ''}`,
                      detail: transport.phoneNumber
                    }))}
                    onItemClick={(item) => handleTransportSelect(item.data)}
                    emptyMessage={t('form.options.startTypingTransport')}
                    searchTerm={transportSearchTerm}
                    createNewMessage={`${t('form.options.createNewTransport')} {searchTerm}`}
                    createNewDetail={t('form.options.enterPhoneToCreate')}
                    onCreateNew={() => {
                      // This will be handled by the form when user enters phone number
                      setShowTransportDropdown(false);
                    }}
                  />
                </div>
              </FormGroup>
              <FormGroup>
                <Label htmlFor="transportNumberPlate">{t('form.fields.numberPlate')}</Label>
                <Input
                  type="text"
                  id="transportNumberPlate"
                  value={transportNumberPlate}
                  onChange={(e) => setTransportNumberPlate(e.target.value)}
                  placeholder={t('form.placeholders.enterNumberPlate')}
                />
              </FormGroup>
            </FormRow>
            <FormRow>
              <FormGroup>
                <Label htmlFor="transportPhoneNumber">{t('form.fields.phoneNumber')}</Label>
                <Input
                  type="tel"
                  id="transportPhoneNumber"
                  value={transportPhoneNumber}
                  onChange={(e) => setTransportPhoneNumber(e.target.value)}
                  placeholder={t('form.placeholders.enterPhoneNumber')}
                />
              </FormGroup>
              <FormGroup>
                <Label htmlFor="transportDate">{t('form.fields.transportDate')}</Label>
                <Input
                  type="date"
                  id="transportDate"
                  value={transportDate}
                  onChange={(e) => setTransportDate(e.target.value)}
                  placeholder={t('form.placeholders.selectTransportDate')}
                />
              </FormGroup>
            </FormRow>
          </FormSection>

          {/* Supplier Section */}
          <FormSection title={t('form.sections.supplier')} titleIcon={Building2}>
            <FormRow>
              <FormGroup>
                <Label htmlFor="supplier">{t('form.sections.supplier')}</Label>
                <Select
                  id="supplier"
                  value={selectedSupplierId?.toString() || 'none'}
                  onChange={(e) => handleSupplierChange(e.target.value)}
                >
                  <option value="none">{t('form.options.noSupplier')}</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                  <option value="new">+ {t('form.options.createNewSupplier')}</option>
                </Select>
              </FormGroup>
              <FormGroup>
                <Label htmlFor="supplierContact">{t('form.fields.supplierContact')}</Label>
                <Input
                  type="text"
                  id="supplierContact"
                  value={supplierContact}
                  onChange={(e) => setSupplierContact(e.target.value)}
                  placeholder={t('form.placeholders.contactInformation')}
                />
              </FormGroup>
            </FormRow>

            {/* Create New Supplier Form */}
            {showCreateSupplier && (
              <div className="supplier-creation-form">
                <h4>{t('form.labels.createNewSupplier')}</h4>
                <FormRow>
                  <FormGroup>
                    <Label htmlFor="supplierName">{t('form.fields.supplierName')} *</Label>
                    <Input
                      type="text"
                      id="supplierName"
                      value={newSupplier.name || ''}
                      onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                      placeholder={t('form.placeholders.enterSupplierName')}
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label htmlFor="supplierContactPerson">{t('form.fields.contactPerson')}</Label>
                    <Input
                      type="text"
                      id="supplierContactPerson"
                      value={newSupplier.contactPerson || ''}
                      onChange={(e) => setNewSupplier({ ...newSupplier, contactPerson: e.target.value })}
                      placeholder={t('form.placeholders.contactPersonName')}
                    />
                  </FormGroup>
                </FormRow>

                <FormRow>
                  <FormGroup>
                    <Label htmlFor="supplierPhone">{t('form.fields.phone')}</Label>
                    <Input
                      type="text"
                      id="supplierPhone"
                      value={newSupplier.phone || ''}
                      onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                      placeholder={t('form.placeholders.phoneNumber')}
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label htmlFor="supplierEmail">{t('form.fields.email')}</Label>
                    <Input
                      type="email"
                      id="supplierEmail"
                      value={newSupplier.email || ''}
                      onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                      placeholder={t('form.placeholders.emailAddress')}
                    />
                  </FormGroup>
                </FormRow>

                <FormRow>
                  <FormGroup>
                    <Label htmlFor="supplierAddress">{t('form.fields.address')}</Label>
                    <Input
                      type="text"
                      id="supplierAddress"
                      value={newSupplier.address || ''}
                      onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                      placeholder={t('form.placeholders.streetAddress')}
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label htmlFor="supplierCity">{t('form.fields.city')}</Label>
                    <Input
                      type="text"
                      id="supplierCity"
                      value={newSupplier.city || ''}
                      onChange={(e) => setNewSupplier({ ...newSupplier, city: e.target.value })}
                      placeholder={t('form.placeholders.city')}
                    />
                  </FormGroup>
                </FormRow>

                <FormGroup>
                  <Label htmlFor="supplierCountry">{t('form.fields.country')}</Label>
                  <Input
                    type="text"
                    id="supplierCountry"
                    value={newSupplier.country || ''}
                    onChange={(e) => setNewSupplier({ ...newSupplier, country: e.target.value })}
                    placeholder={t('form.placeholders.country')}
                  />
                </FormGroup>

                <div className="form-actions">
                  <button
                    type="button"
                    className="save-item-button"
                    onClick={handleCreateSupplier}
                  >
                    <Building2 size={16} />
                     {t('form.labels.createNewSupplier')}
                  </button>
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={() => setShowCreateSupplier(false)}
                  >
                    {t('form.buttons.cancel')}
                  </button>
                </div>
              </div>
            )}
          </FormSection>

          {/* Materials Section */}
          <FormSection title={t('form.sections.materials')} titleIcon={Package}>
            <div className="section-header">
              <div></div>
              <button
                type="button"
                className="btn btn-md btn-primary"
                onClick={() => setShowAddItemForm(!showAddItemForm)}
              >
                <Plus size={20} />
                {t('form.buttons.addMaterial')}
              </button>
            </div>
            {/* Material Error Message */}
            {materialError && (
              <ErrorMessage
                message={materialError}
                onDismiss={() => setMaterialError(null)}
              />
            )}

            {/* Add Item Form */}
            {showAddItemForm && (
              <div className="add-item-form">
                <FormRow>
                  <FormGroup className="material-search-group">
                    <Label htmlFor="materialSearch">{t('form.fields.materialName')} *</Label>
                    <div className="material-search-container">
                      <Input
                        type="text"
                        id="materialSearch"
                        value={materialSearchTerm}
                        onChange={handleMaterialSearchChange}
                        onFocus={() => setShowMaterialDropdown(true)}
                        placeholder={t('form.placeholders.searchOrCreateMaterial')}
                        className="material-search-input"
                      />
                      <DropdownMenu<RawMaterial>
                        isOpen={showMaterialDropdown}
                        items={filteredMaterials.map(material => ({
                          id: material.id,
                          data: material,
                          label: `${material.name} (${material.color})`,
                          detail: `${material.quantity} ${material.quantityType} ${t('common:labels.available')}`
                        }))}
                        onItemClick={(item) => handleMaterialSelect(item.data)}
                        emptyMessage={t('form.messages.noMaterialsFound')}
                      />
                    </div>
                  </FormGroup>
                  <FormGroup>
                    <Label htmlFor="itemColor">{t('form.fields.color')} *</Label>
                    <Input
                      type="text"
                      id="itemColor"
                      value={newItem.color || ''}
                      onChange={(e) => setNewItem({ ...newItem, color: e.target.value })}
                      placeholder={t('form.placeholders.enterMaterialColor')}
                      disabled={!newItem.isNew}
                      className={!newItem.isNew ? 'disabled-field' : ''}
                    />
                  </FormGroup>
                </FormRow>

                <FormRow>
                  <FormGroup>
                    <Label htmlFor="itemQuantity">{t('form.fields.quantity')} *</Label>
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
                  <FormGroup>
                    <Label htmlFor="itemUnit">{t('form.fields.unitOfMeasure')} *</Label>
                    <Input
                      type="text"
                      id="itemUnit"
                      value={newItem.unitOfMeasure || ''}
                      onChange={(e) => setNewItem({ ...newItem, unitOfMeasure: e.target.value })}
                      placeholder={t('form.placeholders.unitExample')}
                      disabled={!newItem.isNew}
                      className={!newItem.isNew ? 'disabled-field' : ''}
                    />
                  </FormGroup>
                </FormRow>

                <FormGroup>
                  <Label htmlFor="itemDescription">{t('form.fields.itemDescription')}</Label>
                  <Textarea
                    id="itemDescription"
                    value={newItem.description || ''}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    placeholder={t('form.placeholders.materialDescription')}
                    rows={2}
                    disabled={!newItem.isNew}
                    className={!newItem.isNew ? 'disabled-field' : ''}
                  />
                </FormGroup>

                <FormRow>
                  <button
                    type="button"
                    className="btn btn-md btn-primary"
                    onClick={handleAddNewMaterial}
                  >
                    {t('form.buttons.addMaterial')}
                  </button>
                  <button
                    type="button"
                    className="btn btn-md btn-secondary"
                    onClick={() => setShowAddItemForm(false)}
                  >
                    {t('form.buttons.cancel')}
                  </button>
                </FormRow>
              </div>
            )}


            {/* Selected Items */}
            {items.length > 0 && (
              <div className="selected-items">
                <h4>{t('form.labels.selectedMaterials')} ({items.length})</h4>
                <div className="items-list">
                  {items.map((item) => (
                    <div key={item.id} className="item-card">
                      <div className="item-info">
                        <div className="item-name">{item.name}</div>
                        <div className="item-color">{t('form.itemCard.color')}: {item.color}</div>
                        {item.description && (
                          <div className="item-description">{item.description}</div>
                        )}
                      </div>
                      <div className="item-details">
                        <FormRow>
                          <FormGroup>
                            <Label>{t('form.itemCard.quantity')}</Label>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleUpdateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                              onWheel={handleWheel}
                              min="0"
                              step="0.01"
                            />
                          </FormGroup>
                          <FormGroup>
                            <Label>{t('form.itemCard.unit')}</Label>
                            <Input
                              type="text"
                              value={item.unitOfMeasure}
                              onChange={(e) => handleUpdateItem(item.id, { unitOfMeasure: e.target.value })}
                              disabled={true}
                              className={!item.isNew ? 'disabled-field' : ''}
                            />
                          </FormGroup>
                        </FormRow>
                        <FormRow>
                          <FormGroup>
                            <Label>{t('form.itemCard.color')}</Label>
                            <Input
                              type="text"
                              value={item.color}
                              onChange={(e) => handleUpdateItem(item.id, { color: e.target.value })}
                              placeholder={t('form.placeholders.enterColor')}
                              disabled={true}
                              className={!item.isNew ? 'disabled-field' : ''}
                            />
                          </FormGroup>
                        </FormRow>
                        <FormGroup>
                          <Label>{t('form.fields.itemDescription')}</Label>
                          <Textarea
                            value={item.description}
                            onChange={(e) => handleUpdateItem(item.id, { description: e.target.value })}
                            placeholder={t('form.placeholders.materialDescription')}
                            rows={2}
                            disabled={true}
                            className={!item.isNew ? 'disabled-field' : ''}
                          />
                        </FormGroup>
                        <div className="item-total">
                          {t('form.itemCard.quantity')}: {item.quantity} {item.unitOfMeasure}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-md btn-danger"
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
                  {t('form.labels.totalItems')}: {items.length} {t('form.labels.materialsSelected')}
                </strong>
              </div>
            )}
          </FormSection>
        </Form>
      </Modal>
    );
  };

export default CreateAcquisition;
