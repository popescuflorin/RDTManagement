import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { acquisitionApi, inventoryApi, supplierApi, transportApi, userApi } from '../../services/api';
import type { RawMaterial, UpdateAcquisitionRequest, Supplier, CreateSupplierRequest, Transport, CreateTransportRequest, User, Acquisition } from '../../types';
import { AcquisitionType, MaterialType } from '../../types';
import { Plus, Trash2, Building2, FileText, Truck, Package, UserCircle } from 'lucide-react';
import { Modal, Form, FormSection, FormRow, FormGroup, Label, Input, Textarea, Select, ErrorMessage, DropdownMenu, Button } from '../atoms';

interface EditAcquisitionProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  acquisition: Acquisition;
}

interface AcquisitionItem {
  id?: number;
  rawMaterialId: number;
  name: string;
  color: string;
  description: string;
  quantity: number;
  unitOfMeasure: string;
  isNew: boolean;
}

const EditAcquisition: React.FC<EditAcquisitionProps> = ({
  isOpen,
  onClose,
  onSuccess,
  acquisition
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
  const [dueDate, setDueDate] = useState('');

  // Transport details
  const [selectedTransportId, setSelectedTransportId] = useState<number | null>(null);
  const [transportSearchTerm, setTransportSearchTerm] = useState('');
  const [showTransportDropdown, setShowTransportDropdown] = useState(false);
  const [transportNumberPlate, setTransportNumberPlate] = useState('');
  const [transportPhoneNumber, setTransportPhoneNumber] = useState('');
  const [transportDate, setTransportDate] = useState('');
  const [transportNotes, setTransportNotes] = useState('');
  
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
    if (isOpen && acquisition) {
      loadRawMaterials();
      loadSuppliers();
      loadTransports();
      loadUsers();
      populateFormData();
    }
  }, [isOpen, acquisition]);

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

  const populateFormData = () => {
    setTitle(acquisition.title);
    setDescription(acquisition.description);
    setSelectedAssignedUserId(acquisition.assignedToUserId || null);
    setSelectedSupplierId(acquisition.supplierId || null);
    setSupplierContact(acquisition.supplierContact || '');
    setNotes(acquisition.notes || '');
    setDueDate(acquisition.dueDate ? acquisition.dueDate.split('T')[0] : '');
    
    // Transport details
    setSelectedTransportId(acquisition.transportId || null);
    setTransportSearchTerm(acquisition.transportCarName || '');
    setTransportNumberPlate(acquisition.transportNumberPlate || '');
    setTransportPhoneNumber(acquisition.transportPhoneNumber || '');
    setTransportDate(acquisition.transportDate ? acquisition.transportDate.split('T')[0] : '');
    setTransportNotes(acquisition.transportNotes || '');
    
    // Convert acquisition items to local format
    const mappedItems: AcquisitionItem[] = acquisition.items.map(item => ({
      id: item.id,
      rawMaterialId: item.rawMaterialId,
      name: item.rawMaterialName,
      color: item.rawMaterialColor,
      description: '', // Description is not stored in acquisition items
      quantity: item.quantity,
      unitOfMeasure: item.quantityType,
      isNew: false // Existing items from the acquisition
    }));
    setItems(mappedItems);
  };

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
    } catch (err: any) {
      setError(t('form.messages.failedToLoadUsers'));
    }
  };

  const handleAddNewMaterial = () => {
    if (!newItem.name || !newItem.color || !newItem.unitOfMeasure || !newItem.quantity || newItem.quantity <= 0) {
      setMaterialError(t('form.messages.fillRequiredFields'));
      return;
    }

    const newItemData: AcquisitionItem = {
      rawMaterialId: newItem.rawMaterialId || 0,
      name: newItem.name!,
      color: newItem.color!,
      description: newItem.description || '',
      quantity: newItem.quantity!,
      unitOfMeasure: newItem.unitOfMeasure!,
      isNew: newItem.isNew || true
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

  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    // Prevent number input from changing value when scrolling
    if (e.currentTarget.type === 'number') {
      e.currentTarget.blur();
    }
  };

  const handleUpdateItem = (index: number, updates: Partial<AcquisitionItem>) => {
    setItems(items.map((item, i) => 
      i === index ? { ...item, ...updates } : item
    ));
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Filter materials based on search term and acquisition type
  const filteredMaterials = rawMaterials.filter(material => {
    const matchesType = (acquisition.type === AcquisitionType.RawMaterials && material.type === MaterialType.RawMaterial) ||
                        (acquisition.type === AcquisitionType.RecyclableMaterials && material.type === MaterialType.RecyclableMaterial);
    
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
      rawMaterialId: material.id,
      name: material.name,
      color: material.color,
      description: material.description || '',
      unitOfMeasure: material.quantityType,
      isNew: false
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
      
      const selectedSupplier = suppliers.find(s => s.id === supplierIdNum);
      if (selectedSupplier) {
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

      const updateRequest: UpdateAcquisitionRequest = {
        title: title.trim(),
        description: description.trim(),
        assignedToUserId: selectedAssignedUserId || undefined,
        supplierId: selectedSupplierId || undefined,
        supplierContact: supplierContact.trim() || undefined,
        notes: notes.trim() || undefined,
        dueDate: dueDate || undefined,
        transportId: transportId || undefined,
        transportDate: transportDate || undefined,
        transportNotes: transportNotes.trim() || undefined,
        items: items.map((item) => {
          const parsedId = item.rawMaterialId ? parseInt(item.rawMaterialId.toString()) : 0;
          const rawMaterialId = isNaN(parsedId) ? 0 : parsedId;
          
          return {
            id: item.id, // Include existing item ID
            rawMaterialId: rawMaterialId,
            name: item.name,
            color: item.color,
            description: item.description,
            quantity: item.quantity,
            quantityType: item.unitOfMeasure
          };
        })
      };

      await acquisitionApi.updateAcquisition(acquisition.id, updateRequest);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || t('form.messages.failedToUpdateAcquisition'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('form.editTitle')}
      titleIcon={FileText}
      submitText={isLoading ? t('form.buttons.updating') : t('form.buttons.update')}
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
                <Input
                  type="text"
                  id="type"
                  value={acquisition.type === AcquisitionType.RawMaterials ? t('type.rawMaterials') : t('type.recyclableMaterials')}
                  disabled
                  className="disabled-field"
                />
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
                <div className="material-search-container" style={{ position: 'relative' }}>
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
            <FormRow>
              <FormGroup>
                <Label htmlFor="transportNotes">{t('form.fields.transportNotes')}</Label>
                <Input
                  type="text"
                  id="transportNotes"
                  value={transportNotes}
                  onChange={(e) => setTransportNotes(e.target.value)}
                  placeholder={t('form.placeholders.additionalTransportNotes')}
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

                <FormRow>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleCreateSupplier}
                  >
                    <Building2 size={16} />
                     {t('form.labels.createNewSupplier')}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowCreateSupplier(false)}
                  >
                    {t('form.buttons.cancel')}
                  </Button>
                </FormRow>
              </div>
            )}
          </FormSection>

          {/* Materials Section */}
          <FormSection title={t('form.sections.materials')} titleIcon={Package}>
            {!showAddItemForm ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowAddItemForm(true)}
              >
                <Plus size={20} />
                {t('form.buttons.addMaterial')}
              </Button>
            ) : null}

            {/* Material Error Message */}
            {materialError && (
              <ErrorMessage
                message={materialError}
                onDismiss={() => setMaterialError(null)}
              />
            )}

            {/* Add Item Form */}
            {showAddItemForm && (
              <div className="add-item-form" style={{ 
                padding: 'var(--space-lg)', 
                border: '1px solid var(--border)', 
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--background-secondary)'
              }}>
                <FormRow>
                  <FormGroup className="material-search-group">
                    <Label htmlFor="materialSearch">{t('form.fields.materialName')} *</Label>
                    <div className="material-search-container" style={{ position: 'relative' }}>
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
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleAddNewMaterial}
                  >
                    {t('form.buttons.addMaterial')}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowAddItemForm(false)}
                  >
                    {t('form.buttons.cancel')}
                  </Button>
                </FormRow>
              </div>
            )}

            {/* Selected Items */}
            {items.length > 0 && (
              <div style={{ marginTop: 'var(--space-lg)' }}>
                <h4 style={{ marginBottom: 'var(--space-md)' }}>
                  {t('form.labels.selectedMaterials')} ({items.length})
                </h4>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 'var(--space-md)' 
                }}>
                  {items.map((item, index) => (
                    <div key={index} style={{ 
                      padding: 'var(--space-lg)', 
                      border: '1px solid var(--border)', 
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--surface)',
                      display: 'flex',
                      gap: 'var(--space-md)',
                      alignItems: 'flex-start'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          fontWeight: 600, 
                          fontSize: 'var(--text-base)', 
                          marginBottom: 'var(--space-xs)' 
                        }}>
                          {item.name}
                        </div>
                        <div style={{ 
                          fontSize: 'var(--text-sm)', 
                          color: 'var(--text-secondary)',
                          marginBottom: 'var(--space-xs)' 
                        }}>
                          {t('form.itemCard.color')}: {item.color}
                        </div>
                        {item.description && (
                          <div style={{ 
                            fontSize: 'var(--text-sm)', 
                            color: 'var(--text-secondary)' 
                          }}>
                            {item.description}
                          </div>
                        )}
                      </div>
                      <div style={{ flex: 2 }}>
                        <FormRow>
                          <FormGroup>
                            <Label>{t('form.itemCard.quantity')}</Label>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleUpdateItem(index, { quantity: parseFloat(e.target.value) || 0 })}
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
                              onChange={(e) => handleUpdateItem(index, { unitOfMeasure: e.target.value })}
                              disabled={true}
                              className="disabled-field"
                            />
                          </FormGroup>
                        </FormRow>
                        <FormRow>
                          <FormGroup>
                            <Label>{t('form.itemCard.color')}</Label>
                            <Input
                              type="text"
                              value={item.color}
                              onChange={(e) => handleUpdateItem(index, { color: e.target.value })}
                              placeholder={t('form.placeholders.enterColor')}
                              disabled={true}
                              className="disabled-field"
                            />
                          </FormGroup>
                        </FormRow>
                        <FormGroup>
                          <Label>{t('form.fields.itemDescription')}</Label>
                          <Textarea
                            value={item.description}
                            onChange={(e) => handleUpdateItem(index, { description: e.target.value })}
                            placeholder={t('form.placeholders.materialDescription')}
                            rows={2}
                            disabled={true}
                            className="disabled-field"
                          />
                        </FormGroup>
                        <div style={{ 
                          marginTop: 'var(--space-md)', 
                          padding: 'var(--space-sm)', 
                          backgroundColor: 'var(--background-secondary)', 
                          borderRadius: 'var(--radius-sm)',
                          fontWeight: 600
                        }}>
                          {t('form.itemCard.quantity')}: {item.quantity} {item.unitOfMeasure}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => handleRemoveItem(index)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Items Summary */}
            {items.length > 0 && (
              <div style={{ 
                marginTop: 'var(--space-lg)', 
                padding: 'var(--space-md)', 
                display: 'flex', 
                justifyContent: 'flex-end',
                borderTop: '1px solid var(--border)',
                backgroundColor: 'var(--background-secondary)'
              }}>
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

export default EditAcquisition;

