import React, { useState } from 'react';
import { transportApi } from '../../services/api';
import type { CreateTransportRequest } from '../../types';
import { X, Truck } from 'lucide-react';
import './CreateTransport.css';

interface CreateTransportProps {
  onClose: () => void;
  onTransportCreated: () => void;
}

const CreateTransport: React.FC<CreateTransportProps> = ({
  onClose,
  onTransportCreated
}) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.carName.trim()) {
      setError('Car name is required');
      return;
    }

    if (!formData.phoneNumber.trim()) {
      setError('Phone number is required');
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
      setError(err.response?.data?.message || 'Failed to create transport');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content create-transport-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <Truck size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Create New Transport Vehicle
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
                <label htmlFor="carName">Car Name *</label>
                <input
                  type="text"
                  id="carName"
                  name="carName"
                  value={formData.carName}
                  onChange={handleChange}
                  placeholder="Enter car name"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="numberPlate">Number Plate</label>
                <input
                  type="text"
                  id="numberPlate"
                  name="numberPlate"
                  value={formData.numberPlate}
                  onChange={handleChange}
                  placeholder="Enter number plate (optional)"
                  maxLength={20}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phoneNumber">Phone Number *</label>
                <input
                  type="text"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="Enter phone number"
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
              Cancel
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Transport'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTransport;

