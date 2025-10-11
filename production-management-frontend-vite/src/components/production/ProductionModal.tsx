import React, { useState } from 'react';
import { productionApi } from '../../services/api';
import type { Product, ProduceProductRequest, ProductionResult } from '../../types';
import './ProductionModal.css';

interface ProductionModalProps {
  product: Product;
  onClose: () => void;
  onProductionCompleted: () => void;
}

const ProductionModal: React.FC<ProductionModalProps> = ({ product, onClose, onProductionCompleted }) => {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productionResult, setProductionResult] = useState<ProductionResult | null>(null);

  const handleProduce = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const request: ProduceProductRequest = {
        productId: product.id,
        quantity,
        notes: notes || undefined
      };

      const response = await productionApi.produceProduct(request);
      setProductionResult(response.data);
    } catch (error: any) {
      console.error('Error producing product:', error);
      const errorMessage = error.response?.data?.message || 'Failed to produce product. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (productionResult) {
      onProductionCompleted();
    } else {
      onClose();
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const totalEstimatedCost = product.estimatedCost * quantity;
  const totalEstimatedProfit = product.estimatedProfit * quantity;

  return (
    <div className="production-modal-overlay">
      <div className="production-modal">
        <div className="production-modal-header">
          <h2>🏭 Produce Product</h2>
          <button className="close-button" onClick={handleClose}>×</button>
        </div>

        <div className="production-modal-content">
          {productionResult ? (
            <div className="production-success">
              <div className="success-icon">✅</div>
              <h3>Production Completed Successfully!</h3>
              
              <div className="production-summary">
                <div className="summary-item">
                  <span className="label">Product:</span>
                  <span className="value">{product.name}</span>
                </div>
                <div className="summary-item">
                  <span className="label">Quantity Produced:</span>
                  <span className="value">{productionResult.productsProduced} units</span>
                </div>
                <div className="summary-item">
                  <span className="label">Total Cost:</span>
                  <span className="value">{formatCurrency(productionResult.totalCost)}</span>
                </div>
                <div className="summary-item">
                  <span className="label">Production Date:</span>
                  <span className="value">{new Date(productionResult.productionDate).toLocaleString()}</span>
                </div>
              </div>

              <div className="materials-consumed">
                <h4>Materials Consumed:</h4>
                {productionResult.materialsConsumed.map((material) => (
                  <div key={material.materialId} className="consumed-material">
                    <span className="material-name">
                      {material.materialName} ({material.materialColor})
                    </span>
                    <span className="material-quantity">
                      {material.quantityConsumed} {material.quantityType}
                    </span>
                    <span className="material-cost">
                      {formatCurrency(material.cost)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="production-form">
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              <div className="product-info">
                <h3>{product.name}</h3>
                <p className="product-description">{product.description}</p>
                
                <div className="product-details">
                  <div className="detail-item">
                    <span className="label">Category:</span>
                    <span className="value">{product.category}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Selling Price:</span>
                    <span className="value">{formatCurrency(product.sellingPrice)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Estimated Cost per Unit:</span>
                    <span className="value">{formatCurrency(product.estimatedCost)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Estimated Profit per Unit:</span>
                    <span className={`value ${product.estimatedProfit >= 0 ? 'positive' : 'negative'}`}>
                      {formatCurrency(product.estimatedProfit)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="required-materials">
                <h4>Required Materials per Unit:</h4>
                {product.requiredMaterials.map((material) => (
                  <div key={material.id} className="material-requirement">
                    <span className="material-name">
                      {material.materialName} ({material.materialColor})
                    </span>
                    <span className="material-quantity">
                      {material.requiredQuantity} {material.quantityType}
                    </span>
                  </div>
                ))}
              </div>

              {product.missingMaterials.length > 0 && (
                <div className="missing-materials">
                  <h4>⚠️ Missing Materials:</h4>
                  {product.missingMaterials.map((missing, index) => (
                    <div key={index} className="missing-item">
                      {missing}
                    </div>
                  ))}
                </div>
              )}

              <div className="production-inputs">
                <div className="form-group">
                  <label htmlFor="quantity">Quantity to Produce:</label>
                  <input
                    type="number"
                    id="quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    min="1"
                    max="100"
                    disabled={isLoading || !product.canProduce}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="notes">Production Notes (optional):</label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special notes for this production run..."
                    rows={3}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {quantity > 1 && (
                <div className="total-calculations">
                  <div className="calc-item">
                    <span className="label">Total Estimated Cost:</span>
                    <span className="value">{formatCurrency(totalEstimatedCost)}</span>
                  </div>
                  <div className="calc-item">
                    <span className="label">Total Estimated Profit:</span>
                    <span className={`value ${totalEstimatedProfit >= 0 ? 'positive' : 'negative'}`}>
                      {formatCurrency(totalEstimatedProfit)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="production-modal-actions">
          {productionResult ? (
            <button onClick={handleClose} className="close-success-button">
              Close
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                className="cancel-button"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleProduce}
                className="produce-button"
                disabled={isLoading || !product.canProduce}
              >
                {isLoading ? 'Producing...' : `Produce ${quantity} Unit${quantity > 1 ? 's' : ''}`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductionModal;
