import React, { useState } from 'react';
import type { Product } from '../types';

interface EditProductProps {
  product: Product;
  onClose: () => void;
  onProductUpdated: (product: Product) => void;
}

const EditProduct: React.FC<EditProductProps> = ({ product, onClose, onProductUpdated }) => {
  // Placeholder component - will be implemented later
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Edit Product</h2>
        <p>Edit functionality coming soon...</p>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default EditProduct;
