import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { clientApi } from '../../services/api';
import type { CreateClientRequest } from '../../types';
import { UserCircle } from 'lucide-react';
import { Modal, Form, FormSection, FormRow, FormGroup, Label, Input, Textarea } from '../atoms';

interface CreateClientProps {
  isOpen: boolean;
  onClose: () => void;
  onClientCreated: () => void;
}

const CreateClient: React.FC<CreateClientProps> = ({
  isOpen,
  onClose,
  onClientCreated
}) => {
  const { t } = useTranslation(['clients', 'common']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateClientRequest>({
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError(t('createClient.messages.clientNameRequired'));
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const request: CreateClientRequest = {
        name: formData.name.trim(),
        contactPerson: formData.contactPerson?.trim() || undefined,
        email: formData.email?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
        address: formData.address?.trim() || undefined,
        city: formData.city?.trim() || undefined,
        postalCode: formData.postalCode?.trim() || undefined,
        country: formData.country?.trim() || undefined,
        notes: formData.notes?.trim() || undefined
      };

      await clientApi.createClient(request);
      onClientCreated();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || t('createClient.messages.failedToCreate'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('createClient.title')}
      titleIcon={UserCircle}
      submitText={isLoading ? t('createClient.buttons.creating', { defaultValue: 'Creating...' }) : t('createClient.buttons.createClient', { defaultValue: 'Create Client' })}
      cancelText={t('createClient.buttons.cancel', { defaultValue: 'Cancel' })}
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
                {t('createClient.fields.clientName')}
              </Label>
              <Input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder={t('createClient.placeholders.clientName')}
                required
              />
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup>
              <Label htmlFor="contactPerson">
                {t('createClient.fields.contactPerson')}
              </Label>
              <Input
                type="text"
                id="contactPerson"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                placeholder={t('createClient.placeholders.contactPerson')}
              />
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup>
              <Label htmlFor="email">
                {t('createClient.fields.email')}
              </Label>
              <Input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={t('createClient.placeholders.email')}
              />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="phone">
                {t('createClient.fields.phone')}
              </Label>
              <Input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder={t('createClient.placeholders.phone')}
              />
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup fullWidth>
              <Label htmlFor="address">
                {t('createClient.fields.address')}
              </Label>
              <Input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder={t('createClient.placeholders.address')}
              />
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup>
              <Label htmlFor="city">
                {t('createClient.fields.city')}
              </Label>
              <Input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder={t('createClient.placeholders.city')}
              />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="postalCode">
                {t('createClient.fields.postalCode')}
              </Label>
              <Input
                type="text"
                id="postalCode"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                placeholder={t('createClient.placeholders.postalCode')}
              />
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup>
              <Label htmlFor="country">
                {t('createClient.fields.country')}
              </Label>
              <Input
                type="text"
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder={t('createClient.placeholders.country')}
              />
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup fullWidth>
              <Label htmlFor="notes">
                {t('createClient.fields.notes')}
              </Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder={t('createClient.placeholders.notes')}
                rows={3}
              />
            </FormGroup>
          </FormRow>
        </FormSection>
      </Form>
    </Modal>
  );
};

export default CreateClient;

