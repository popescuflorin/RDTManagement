import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supplierApi } from '../../services/api';
import type { Supplier, UpdateSupplierRequest } from '../../types';
import { Building2 } from 'lucide-react';
import { Modal, Form, FormSection, FormRow, FormGroup, Label, Input, Textarea, Checkbox } from '../atoms';
import './CreateSupplier.css';

interface EditSupplierProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  supplier: Supplier;
}

const EditSupplier: React.FC<EditSupplierProps> = ({
  isOpen,
  onClose,
  onSuccess,
  supplier
}) => {
  const { t } = useTranslation(['suppliers', 'common']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<UpdateSupplierRequest>({
    name: '',
    description: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    taxId: '',
    registrationNumber: '',
    notes: '',
    isActive: true
  });

  useEffect(() => {
    if (isOpen && supplier) {
      setFormData({
        name: supplier.name || '',
        description: supplier.description || '',
        contactPerson: supplier.contactPerson || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        city: supplier.city || '',
        postalCode: supplier.postalCode || '',
        country: supplier.country || '',
        taxId: supplier.taxId || '',
        registrationNumber: supplier.registrationNumber || '',
        notes: supplier.notes || '',
        isActive: supplier.isActive
      });
    }
  }, [isOpen, supplier]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name?.trim()) {
      setError(t('editSupplier.messages.supplierNameRequired'));
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const request: UpdateSupplierRequest = {
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        contactPerson: formData.contactPerson?.trim() || undefined,
        email: formData.email?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
        address: formData.address?.trim() || undefined,
        city: formData.city?.trim() || undefined,
        postalCode: formData.postalCode?.trim() || undefined,
        country: formData.country?.trim() || undefined,
        taxId: formData.taxId?.trim() || undefined,
        registrationNumber: formData.registrationNumber?.trim() || undefined,
        notes: formData.notes?.trim() || undefined,
        isActive: formData.isActive
      };

      await supplierApi.updateSupplier(supplier.id, request);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || t('editSupplier.messages.failedToUpdate'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('editSupplier.title')}
      titleIcon={Building2}
      submitText={isLoading ? t('editSupplier.buttons.updating', { defaultValue: 'Updating...' }) : t('editSupplier.buttons.updateSupplier', { defaultValue: 'Update Supplier' })}
      cancelText={t('editSupplier.buttons.cancel', { defaultValue: 'Cancel' })}
      submitVariant="primary"
      isSubmitting={isLoading}
      onSubmit={handleSubmit}
      maxWidth="700px"
    >
      <Form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        {error && (
          <div className="error-message">
            {error}
            <button type="button" onClick={() => setError(null)}>×</button>
          </div>
        )}

        <FormSection>
          <FormRow>
            <FormGroup>
              <Label htmlFor="name" required>
                {t('editSupplier.fields.supplierName')}
              </Label>
              <Input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder={t('editSupplier.placeholders.supplierName')}
                required
              />
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup fullWidth>
              <Label htmlFor="description">
                {t('editSupplier.fields.description')}
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder={t('editSupplier.placeholders.description')}
                rows={2}
              />
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup>
              <Label htmlFor="contactPerson">
                {t('editSupplier.fields.contactPerson')}
              </Label>
              <Input
                type="text"
                id="contactPerson"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                placeholder={t('editSupplier.placeholders.contactPerson')}
              />
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup>
              <Label htmlFor="email">
                {t('editSupplier.fields.email')}
              </Label>
              <Input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={t('editSupplier.placeholders.email')}
              />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="phone">
                {t('editSupplier.fields.phone')}
              </Label>
              <Input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder={t('editSupplier.placeholders.phone')}
              />
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup fullWidth>
              <Label htmlFor="address">
                {t('editSupplier.fields.address')}
              </Label>
              <Input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder={t('editSupplier.placeholders.address')}
              />
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup>
              <Label htmlFor="city">
                {t('editSupplier.fields.city')}
              </Label>
              <Input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder={t('editSupplier.placeholders.city')}
              />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="postalCode">
                {t('editSupplier.fields.postalCode')}
              </Label>
              <Input
                type="text"
                id="postalCode"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                placeholder={t('editSupplier.placeholders.postalCode')}
              />
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup>
              <Label htmlFor="country">
                {t('editSupplier.fields.country')}
              </Label>
              <Input
                type="text"
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder={t('editSupplier.placeholders.country')}
              />
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup>
              <Label htmlFor="taxId">
                {t('editSupplier.fields.taxId')}
              </Label>
              <Input
                type="text"
                id="taxId"
                name="taxId"
                value={formData.taxId}
                onChange={handleChange}
                placeholder={t('editSupplier.placeholders.taxId')}
              />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="registrationNumber">
                {t('editSupplier.fields.registrationNumber')}
              </Label>
              <Input
                type="text"
                id="registrationNumber"
                name="registrationNumber"
                value={formData.registrationNumber}
                onChange={handleChange}
                placeholder={t('editSupplier.placeholders.registrationNumber')}
              />
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup fullWidth>
              <Label htmlFor="notes">
                {t('editSupplier.fields.notes')}
              </Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder={t('editSupplier.placeholders.notes')}
                rows={3}
              />
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup>
              <Checkbox
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                label={t('editSupplier.fields.active')}
                labelUppercase={true}
              />
            </FormGroup>
          </FormRow>
        </FormSection>
      </Form>
    </Modal>
  );
};

export default EditSupplier;

