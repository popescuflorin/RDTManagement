import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { transportApi } from '../../services/api';
import type { Transport, UpdateTransportRequest } from '../../types';
import { Truck } from 'lucide-react';
import { Modal, Form, FormSection, FormRow, FormGroup, Label, Input } from '../atoms';
import './CreateTransport.css';

interface EditTransportProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  transport: Transport;
}

const EditTransport: React.FC<EditTransportProps> = ({
  isOpen,
  onClose,
  onSuccess,
  transport
}) => {
  const { t } = useTranslation(['transports', 'common']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<UpdateTransportRequest>({
    carName: '',
    numberPlate: '',
    phoneNumber: ''
  });

  useEffect(() => {
    if (isOpen && transport) {
      setFormData({
        carName: transport.carName || '',
        numberPlate: transport.numberPlate || '',
        phoneNumber: transport.phoneNumber || ''
      });
    }
  }, [isOpen, transport]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.carName.trim()) {
      setError(t('editTransport.messages.carNameRequired'));
      return;
    }

    if (!formData.phoneNumber.trim()) {
      setError(t('editTransport.messages.phoneNumberRequired'));
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const request: UpdateTransportRequest = {
        carName: formData.carName.trim(),
        numberPlate: formData.numberPlate?.trim() || undefined,
        phoneNumber: formData.phoneNumber.trim()
      };

      await transportApi.updateTransport(transport.id, request);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || t('editTransport.messages.failedToUpdate'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('editTransport.title')}
      titleIcon={Truck}
      submitText={isLoading ? t('editTransport.buttons.updating', { defaultValue: 'Updating...' }) : t('editTransport.buttons.updateTransport', { defaultValue: 'Update Transport' })}
      cancelText={t('editTransport.buttons.cancel', { defaultValue: 'Cancel' })}
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
                {t('editTransport.fields.carName')}
              </Label>
              <Input
                type="text"
                id="carName"
                name="carName"
                value={formData.carName}
                onChange={handleChange}
                placeholder={t('editTransport.placeholders.carName')}
                required
              />
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup>
              <Label htmlFor="numberPlate">
                {t('editTransport.fields.numberPlate')}
              </Label>
              <Input
                type="text"
                id="numberPlate"
                name="numberPlate"
                value={formData.numberPlate}
                onChange={handleChange}
                placeholder={t('editTransport.placeholders.numberPlate')}
                maxLength={20}
              />
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup>
              <Label htmlFor="phoneNumber" required>
                {t('editTransport.fields.phoneNumber')}
              </Label>
              <Input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder={t('editTransport.placeholders.phoneNumber')}
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

export default EditTransport;

