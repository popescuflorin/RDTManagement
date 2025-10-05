import React from 'react';
import type { Product } from '../types';

interface DeleteProductConfirmationProps {
  product: Product;
  onClose: () => void;
  onProductDeleted: (productId: number) => void;
}

const DeleteProductConfirmation: React.FC<DeleteProductConfirmationProps> = ({ 
  product, 
  onClose, 
  onProductDeleted 
}) => {
  // Placeholder component - will be implemented later
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Delete Product</h2>
        <p>Delete confirmation coming soon...</p>
        <button onClick={onClose} className="btn btn-secondary">Close</button>
      </div>
    </div>
  );
};

export default DeleteProductConfirmation;
