import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { transportApi } from '../../services/api';
import type { Transport, UpdateTransportRequest } from '../../types';
import { X, Truck } from 'lucide-react';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
        numberPlate: formData.numberPlate.trim() || undefined,
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

  const handleBackdropClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content create-transport-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <Truck size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            {t('editTransport.title')}
          </h2>
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="transport-form">
          {error && (
            <div className="error-message">
              {error}
              <button type="button" onClick={() => setError(null)}>×</button>
            </div>
          )}

          <div className="form-section">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="carName">{t('editTransport.fields.carName')} *</label>
                <input
                  type="text"
                  id="carName"
                  name="carName"
                  value={formData.carName}
                  onChange={handleChange}
                  placeholder={t('editTransport.placeholders.carName')}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="numberPlate">{t('editTransport.fields.numberPlate')}</label>
                <input
                  type="text"
                  id="numberPlate"
                  name="numberPlate"
                  value={formData.numberPlate}
                  onChange={handleChange}
                  placeholder={t('editTransport.placeholders.numberPlate')}
                  maxLength={20}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phoneNumber">{t('editTransport.fields.phoneNumber')} *</label>
                <input
                  type="text"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder={t('editTransport.placeholders.phoneNumber')}
                  required
                  maxLength={20}
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={onClose}
              disabled={isLoading}
            >
              {t('editTransport.buttons.cancel')}
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={isLoading}
            >
              {isLoading ? t('editTransport.buttons.updating') : t('editTransport.buttons.updateTransport')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTransport;

