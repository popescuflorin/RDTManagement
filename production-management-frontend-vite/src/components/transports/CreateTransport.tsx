import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { transportApi } from '../../services/api';
import type { CreateTransportRequest } from '../../types';
import { Truck } from 'lucide-react';
import { Modal, Form, FormSection, FormRow, FormGroup, Label, Input } from '../atoms';
import './CreateTransport.css';

interface CreateTransportProps {
  isOpen: boolean;
  onClose: () => void;
  onTransportCreated: () => void;
}

const CreateTransport: React.FC<CreateTransportProps> = ({
  isOpen,
  onClose,
  onTransportCreated
}) => {
  const { t } = useTranslation(['transports', 'common']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateTransportRequest>({
    carName: '',
    numberPlate: '',
    phoneNumber: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.carName.trim()) {
      setError(t('createTransport.messages.carNameRequired'));
      return;
    }

    if (!formData.phoneNumber.trim()) {
      setError(t('createTransport.messages.phoneNumberRequired'));
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const request: CreateTransportRequest = {
        carName: formData.carName.trim(),
        numberPlate: (formData.numberPlate?.trim() || undefined),
        phoneNumber: formData.phoneNumber.trim()
      };

      await transportApi.createTransport(request);
      onTransportCreated();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || t('createTransport.messages.failedToCreate'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('createTransport.title')}
      titleIcon={Truck}
      submitText={isLoading ? t('createTransport.buttons.creating', { defaultValue: 'Creating...' }) : t('createTransport.buttons.createTransport', { defaultValue: 'Create Transport' })}
      cancelText={t('createTransport.buttons.cancel', { defaultValue: 'Cancel' })}
      submitVariant="primary"
      isSubmitting={isLoading}
      onSubmit={handleSubmit}
      maxWidth="600px"
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
              <Label htmlFor="carName" required>
                {t('createTransport.fields.carName')}
              </Label>
              <Input
                type="text"
                id="carName"
                name="carName"
                value={formData.carName}
                onChange={handleChange}
                placeholder={t('createTransport.placeholders.carName')}
                required
              />
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup>
              <Label htmlFor="numberPlate">
                {t('createTransport.fields.numberPlate')}
              </Label>
              <Input
                type="text"
                id="numberPlate"
                name="numberPlate"
                value={formData.numberPlate}
                onChange={handleChange}
                placeholder={t('createTransport.placeholders.numberPlate')}
                maxLength={20}
              />
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup>
              <Label htmlFor="phoneNumber" required>
                {t('createTransport.fields.phoneNumber')}
              </Label>
              <Input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder={t('createTransport.placeholders.phoneNumber')}
                required
                maxLength={20}
              />
            </FormGroup>
          </FormRow>
        </FormSection>
      </Form>
    </Modal>
  );
};

export default CreateTransport;

