import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supplierApi } from '../../services/api';
import type { CreateSupplierRequest } from '../../types';
import { X, Building2 } from 'lucide-react';
import './CreateSupplier.css';

interface CreateSupplierProps {
  onClose: () => void;
  onSupplierCreated: () => void;
}

const CreateSupplier: React.FC<CreateSupplierProps> = ({
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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

  const handleBackdropClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content create-supplier-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <Building2 size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            {t('createSupplier.title')}
          </h2>
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="supplier-form">
          {error && (
            <div className="error-message">
              {error}
              <button type="button" onClick={() => setError(null)}>×</button>
            </div>
          )}

          <div className="form-section">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">{t('createSupplier.fields.supplierName')} *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t('createSupplier.placeholders.supplierName')}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="description">{t('createSupplier.fields.description')}</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder={t('createSupplier.placeholders.description')}
                  rows={2}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="contactPerson">{t('createSupplier.fields.contactPerson')}</label>
                <input
                  type="text"
                  id="contactPerson"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  placeholder={t('createSupplier.placeholders.contactPerson')}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">{t('createSupplier.fields.email')}</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t('createSupplier.placeholders.email')}
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone">{t('createSupplier.fields.phone')}</label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder={t('createSupplier.placeholders.phone')}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="address">{t('createSupplier.fields.address')}</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder={t('createSupplier.placeholders.address')}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="city">{t('createSupplier.fields.city')}</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder={t('createSupplier.placeholders.city')}
                />
              </div>
              <div className="form-group">
                <label htmlFor="postalCode">{t('createSupplier.fields.postalCode')}</label>
                <input
                  type="text"
                  id="postalCode"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  placeholder={t('createSupplier.placeholders.postalCode')}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="country">{t('createSupplier.fields.country')}</label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder={t('createSupplier.placeholders.country')}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="taxId">{t('createSupplier.fields.taxId')}</label>
                <input
                  type="text"
                  id="taxId"
                  name="taxId"
                  value={formData.taxId}
                  onChange={handleChange}
                  placeholder={t('createSupplier.placeholders.taxId')}
                />
              </div>
              <div className="form-group">
                <label htmlFor="registrationNumber">{t('createSupplier.fields.registrationNumber')}</label>
                <input
                  type="text"
                  id="registrationNumber"
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={handleChange}
                  placeholder={t('createSupplier.placeholders.registrationNumber')}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="notes">{t('createSupplier.fields.notes')}</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder={t('createSupplier.placeholders.notes')}
                  rows={3}
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
              {t('createSupplier.buttons.cancel')}
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={isLoading}
            >
              {isLoading ? t('createSupplier.buttons.creating') : t('createSupplier.buttons.createSupplier')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSupplier;

