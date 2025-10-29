import React, { useState } from 'react';
import { userApi } from '../../services/api';
import type { User } from '../../types';
import './DeleteConfirmation.css';

interface DeleteConfirmationProps {
  user: User;
  onClose: () => void;
  onUserDeleted: (userId: number) => void;
}

const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({ user, onClose, onUserDeleted }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await userApi.deleteUser(user.id);
      onUserDeleted(user.id);
      onClose();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete user. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="delete-confirmation-overlay">
      <div className="delete-confirmation-modal">
        <div className="delete-confirmation-header">
          <div className="warning-icon">⚠️</div>
          <h2>Delete User</h2>
        </div>

        <div className="delete-confirmation-content">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <p className="confirmation-text">
            Are you sure you want to delete this user? This action cannot be undone.
          </p>

          <div className="user-details">
            <div className="user-avatar">
              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
            </div>
            <div className="user-info">
              <div className="user-name">{user.firstName} {user.lastName}</div>
              <div className="user-email">{user.email}</div>
              <div className="user-role">Role: {user.role}</div>
            </div>
          </div>

          <div className="warning-text">
            <strong>Warning:</strong> Deleting this user will:
            <ul>
              <li>Remove all user data permanently</li>
              <li>Revoke access to the system</li>
              <li>Cannot be undone</li>
            </ul>
          </div>
        </div>

        <div className="delete-confirmation-actions">
          <button
            type="button"
            onClick={onClose}
            className="cancel-button"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="delete-button"
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete User'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmation;
