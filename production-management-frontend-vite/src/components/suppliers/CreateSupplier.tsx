import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supplierApi } from '../../services/api';
import type { CreateSupplierRequest } from '../../types';
import { Building2 } from 'lucide-react';
import { Modal, Form, FormSection, FormRow, FormGroup, Label, Input, Textarea } from '../atoms';
import './CreateSupplier.css';

interface CreateSupplierProps {
  isOpen: boolean;
  onClose: () => void;
  onSupplierCreated: () => void;
}

const CreateSupplier: React.FC<CreateSupplierProps> = ({
  isOpen,
  onClose,
  onSupplierCreated
}) => {
  const { t } = useTranslation(['suppliers', 'common']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateSupplierRequest>({
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
    notes: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError(t('createSupplier.messages.supplierNameRequired'));
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const request: CreateSupplierRequest = {
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
        notes: formData.notes?.trim() || undefined
      };

      await supplierApi.createSupplier(request);
      onSupplierCreated();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || t('createSupplier.messages.failedToCreate'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('createSupplier.title')}
      titleIcon={Building2}
      submitText={isLoading ? t('createSupplier.buttons.creating', { defaultValue: 'Creating...' }) : t('createSupplier.buttons.createSupplier', { defaultValue: 'Create Supplier' })}
      cancelText={t('createSupplier.buttons.cancel', { defaultValue: 'Cancel' })}
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
                {t('createSupplier.fields.supplierName')}
              </Label>
              <Input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder={t('createSupplier.placeholders.supplierName')}
                required
              />
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup fullWidth>
              <Label htmlFor="description">
                {t('createSupplier.fields.description')}
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder={t('createSupplier.placeholders.description')}
                rows={2}
              />
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup>
              <Label htmlFor="contactPerson">
                {t('createSupplier.fields.contactPerson')}
              </Label>
              <Input
                type="text"
                id="contactPerson"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                placeholder={t('createSupplier.placeholders.contactPerson')}
              />
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup>
              <Label htmlFor="email">
                {t('createSupplier.fields.email')}
              </Label>
              <Input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={t('createSupplier.placeholders.email')}
              />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="phone">
                {t('createSupplier.fields.phone')}
              </Label>
              <Input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder={t('createSupplier.placeholders.phone')}
              />
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup fullWidth>
              <Label htmlFor="address">
                {t('createSupplier.fields.address')}
              </Label>
              <Input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder={t('createSupplier.placeholders.address')}
              />
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup>
              <Label htmlFor="city">
                {t('createSupplier.fields.city')}
              </Label>
              <Input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder={t('createSupplier.placeholders.city')}
              />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="postalCode">
                {t('createSupplier.fields.postalCode')}
              </Label>
              <Input
                type="text"
                id="postalCode"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                placeholder={t('createSupplier.placeholders.postalCode')}
              />
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup>
              <Label htmlFor="country">
                {t('createSupplier.fields.country')}
              </Label>
              <Input
                type="text"
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder={t('createSupplier.placeholders.country')}
              />
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup>
              <Label htmlFor="taxId">
                {t('createSupplier.fields.taxId')}
              </Label>
              <Input
                type="text"
                id="taxId"
                name="taxId"
                value={formData.taxId}
                onChange={handleChange}
                placeholder={t('createSupplier.placeholders.taxId')}
              />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="registrationNumber">
                {t('createSupplier.fields.registrationNumber')}
              </Label>
              <Input
                type="text"
                id="registrationNumber"
                name="registrationNumber"
                value={formData.registrationNumber}
                onChange={handleChange}
                placeholder={t('createSupplier.placeholders.registrationNumber')}
              />
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup fullWidth>
              <Label htmlFor="notes">
                {t('createSupplier.fields.notes')}
              </Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder={t('createSupplier.placeholders.notes')}
                rows={3}
              />
            </FormGroup>
          </FormRow>
        </FormSection>
      </Form>
    </Modal>
  );
};

export default CreateSupplier;

