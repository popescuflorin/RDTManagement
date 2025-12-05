import React, { useState, useEffect } from 'react';
import { clientApi } from '../../services/api';
import type { Client, UpdateClientRequest } from '../../types';
import { X, UserCircle } from 'lucide-react';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name?.trim()) {
      setError('Client name is required');
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
      setError(err.response?.data?.message || 'Failed to update client');
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
      <div className="modal-content create-client-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <UserCircle size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Edit Client
          </h2>
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="client-form">
          {error && (
            <div className="error-message">
              {error}
              <button type="button" onClick={() => setError(null)}>×</button>
            </div>
          )}

          <div className="form-section">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Client Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter client name"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="contactPerson">Contact Person</label>
                <input
                  type="text"
                  id="contactPerson"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  placeholder="Enter contact person name"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone</label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="address">Address</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter street address"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="city">City</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Enter city"
                />
              </div>
              <div className="form-group">
                <label htmlFor="postalCode">Postal Code</label>
                <input
                  type="text"
                  id="postalCode"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  placeholder="Enter postal code"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="country">Country</label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="Enter country"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Optional notes about the client..."
                  rows={3}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                  />
                  <span>Active</span>
                </label>
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
              Cancel
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={isLoading}
            >
              {isLoading ? 'Updating...' : 'Update Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditClient;

