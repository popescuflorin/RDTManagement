import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { clientApi } from '../../services/api';
import type { Client, UpdateClientRequest } from '../../types';
import { UserCircle } from 'lucide-react';
import { Modal, Form, FormSection, FormRow, FormGroup, Label, Input, Textarea, Checkbox } from '../atoms';
import './CreateClient.css';

interface EditClientProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  client: Client;
}

const EditClient: React.FC<EditClientProps> = ({
  isOpen,
  onClose,
  onSuccess,
  client
}) => {
  const { t } = useTranslation(['clients', 'common']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<UpdateClientRequest>({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    notes: '',
    isActive: true
  });

  useEffect(() => {
    if (isOpen && client) {
      setFormData({
        name: client.name || '',
        contactPerson: client.contactPerson || '',
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        city: client.city || '',
        postalCode: client.postalCode || '',
        country: client.country || '',
        notes: client.notes || '',
        isActive: client.isActive
      });
    }
  }, [isOpen, client]);

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
      setError(t('editClient.messages.clientNameRequired'));
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const request: UpdateClientRequest = {
        name: formData.name.trim(),
        contactPerson: formData.contactPerson?.trim() || undefined,
        email: formData.email?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
        address: formData.address?.trim() || undefined,
        city: formData.city?.trim() || undefined,
        postalCode: formData.postalCode?.trim() || undefined,
        country: formData.country?.trim() || undefined,
        notes: formData.notes?.trim() || undefined,
        isActive: formData.isActive
      };

      await clientApi.updateClient(client.id, request);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || t('editClient.messages.failedToUpdate'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('editClient.title')}
      titleIcon={UserCircle}
      submitText={isLoading ? t('editClient.buttons.updating', { defaultValue: 'Updating...' }) : t('editClient.buttons.updateClient', { defaultValue: 'Update Client' })}
      cancelText={t('editClient.buttons.cancel', { defaultValue: 'Cancel' })}
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
                {t('editClient.fields.clientName')}
              </Label>
              <Input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder={t('editClient.placeholders.clientName')}
                required
              />
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup>
              <Label htmlFor="contactPerson">
                {t('editClient.fields.contactPerson')}
              </Label>
              <Input
                type="text"
                id="contactPerson"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                placeholder={t('editClient.placeholders.contactPerson')}
              />
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup>
              <Label htmlFor="email">
                {t('editClient.fields.email')}
              </Label>
              <Input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={t('editClient.placeholders.email')}
              />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="phone">
                {t('editClient.fields.phone')}
              </Label>
              <Input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder={t('editClient.placeholders.phone')}
              />
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup fullWidth>
              <Label htmlFor="address">
                {t('editClient.fields.address')}
              </Label>
              <Input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder={t('editClient.placeholders.address')}
              />
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup>
              <Label htmlFor="city">
                {t('editClient.fields.city')}
              </Label>
              <Input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder={t('editClient.placeholders.city')}
              />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="postalCode">
                {t('editClient.fields.postalCode')}
              </Label>
              <Input
                type="text"
                id="postalCode"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                placeholder={t('editClient.placeholders.postalCode')}
              />
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup>
              <Label htmlFor="country">
                {t('editClient.fields.country')}
              </Label>
              <Input
                type="text"
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder={t('editClient.placeholders.country')}
              />
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup fullWidth>
              <Label htmlFor="notes">
                {t('editClient.fields.notes')}
              </Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder={t('editClient.placeholders.notes')}
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
                label={t('editClient.fields.active')}
                labelUppercase={true}
              />
            </FormGroup>
          </FormRow>
        </FormSection>
      </Form>
    </Modal>
  );
};

export default EditClient;

