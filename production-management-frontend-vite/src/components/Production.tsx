import React, { useState, useEffect } from 'react';
import { productionApi } from '../services/api';
import type { Product, ProductionStatistics } from '../types';
import AddProduct from './AddProduct';
import EditProduct from './EditProduct';
import DeleteProductConfirmation from './DeleteProductConfirmation';
import ProductionModal from './ProductionModal';
import './Production.css';

const Production: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [statistics, setStatistics] = useState<ProductionStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showProductionModal, setShowProductionModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'active' | 'can-produce' | 'cannot-produce'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'price' | 'profit' | 'updated'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [productsResponse, statisticsResponse] = await Promise.all([
        productionApi.getAllProducts(),
        productionApi.getStatistics()
      ]);
      setProducts(productsResponse.data);
      setStatistics(statisticsResponse.data);
    } catch (error: any) {
      console.error('Error loading production data:', error);
      setError('Failed to load production data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductCreated = (newProduct: Product) => {
    setProducts(prevProducts => [...prevProducts, newProduct]);
    setShowAddModal(false);
    loadData(); // Refresh statistics
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowEditModal(true);
  };

  const handleProductUpdated = (updatedProduct: Product) => {
    setProducts(prevProducts => 
      prevProducts.map(product => 
        product.id === updatedProduct.id ? updatedProduct : product
      )
    );
    setShowEditModal(false);
    setSelectedProduct(null);
    loadData(); // Refresh statistics
  };

  const handleDeleteProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowDeleteModal(true);
  };

  const handleProductDeleted = (productId: number) => {
    setProducts(prevProducts => prevProducts.filter(product => product.id !== productId));
    setShowDeleteModal(false);
    setSelectedProduct(null);
    loadData(); // Refresh statistics
  };

  const handleProduceProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowProductionModal(true);
  };

  const handleProductionCompleted = () => {
    setShowProductionModal(false);
    setSelectedProduct(null);
    loadData(); // Refresh all data after production
  };

  const closeModals = () => {
    setShowEditModal(false);
    setShowDeleteModal(false);
    setShowProductionModal(false);
    setSelectedProduct(null);
  };

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const filteredAndSortedProducts = products
    .filter(product => {
      // Search filter
      const searchMatch = searchTerm === '' || 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase());

      // Category filter
      let categoryMatch = true;
      if (filterBy === 'active') {
        categoryMatch = product.isActive;
      } else if (filterBy === 'can-produce') {
        categoryMatch = product.canProduce;
      } else if (filterBy === 'cannot-produce') {
        categoryMatch = !product.canProduce;
      }

      return searchMatch && categoryMatch;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'price':
          comparison = a.sellingPrice - b.sellingPrice;
          break;
        case 'profit':
          comparison = a.estimatedProfit - b.estimatedProfit;
          break;
        case 'updated':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (isLoading) {
    return (
      <div className="production-loading">
        <div className="loading-spinner"></div>
        <p>Loading production data...</p>
      </div>
    );
  }

  return (
    <div className="production-container">
      <div className="production-header">
        <h1>🏭 Production Management</h1>
        <button 
          className="add-product-button"
          onClick={() => setShowAddModal(true)}
        >
          + Add Product
        </button>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="production-stats">
          <div className="stat-card">
            <div className="stat-icon">📦</div>
            <div className="stat-content">
              <div className="stat-number">{statistics.totalProducts}</div>
              <div className="stat-label">Total Products</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-number">{statistics.activeProducts}</div>
              <div className="stat-label">Active Products</div>
            </div>
          </div>
          <div className={`stat-card ${statistics.productsCanProduce < statistics.activeProducts ? 'warning' : ''}`}>
            <div className="stat-icon">🔧</div>
            <div className="stat-content">
              <div className="stat-number">{statistics.productsCanProduce}</div>
              <div className="stat-label">Can Produce</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-number">{statistics.totalFinishedProducts}</div>
              <div className="stat-label">Total Produced</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <div className="stat-number">{formatCurrency(statistics.totalProductionValue)}</div>
              <div className="stat-label">Production Value</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="production-controls">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-container">
          <select 
            value={filterBy} 
            onChange={(e) => setFilterBy(e.target.value as typeof filterBy)}
            className="filter-select"
          >
            <option value="all">All Products</option>
            <option value="active">Active Only</option>
            <option value="can-produce">Can Produce</option>
            <option value="cannot-produce">Cannot Produce</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Products Table */}
      <div className="table-container">
        <table className="products-table">
          <thead>
            <tr>
              <th 
                className={`sortable ${sortBy === 'name' ? `sorted-${sortOrder}` : ''}`}
                onClick={() => handleSort('name')}
              >
                Product
              </th>
              <th 
                className={`sortable ${sortBy === 'category' ? `sorted-${sortOrder}` : ''}`}
                onClick={() => handleSort('category')}
              >
                Category
              </th>
              <th>Materials</th>
              <th 
                className={`sortable ${sortBy === 'price' ? `sorted-${sortOrder}` : ''}`}
                onClick={() => handleSort('price')}
              >
                Price
              </th>
              <th>Cost</th>
              <th 
                className={`sortable ${sortBy === 'profit' ? `sorted-${sortOrder}` : ''}`}
                onClick={() => handleSort('profit')}
              >
                Profit
              </th>
              <th>Time</th>
              <th>Status</th>
              <th 
                className={`sortable ${sortBy === 'updated' ? `sorted-${sortOrder}` : ''}`}
                onClick={() => handleSort('updated')}
              >
                Updated
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedProducts.length === 0 ? (
              <tr>
                <td colSpan={10} className="no-products">
                  {searchTerm || filterBy !== 'all' 
                    ? 'No products found matching your criteria.' 
                    : 'No products defined. Add some products to get started.'}
                </td>
              </tr>
            ) : (
              filteredAndSortedProducts.map((product) => (
                <tr key={product.id} className={!product.isActive ? 'inactive-product' : ''}>
                  <td className="product-name-cell">
                    <div className="product-name">{product.name}</div>
                    {product.description && (
                      <div className="product-description">{product.description}</div>
                    )}
                  </td>
                  <td>
                    <span className="category-badge">{product.category}</span>
                  </td>
                  <td className="materials-cell">
                    <div className="materials-list">
                      {product.requiredMaterials.slice(0, 2).map((material) => (
                        <div key={material.id} className="material-item">
                          <span className="material-name">{material.materialName}</span>
                          <span className="material-quantity">
                            {material.requiredQuantity} {material.quantityType}
                          </span>
                        </div>
                      ))}
                      {product.requiredMaterials.length > 2 && (
                        <div className="materials-more">
                          +{product.requiredMaterials.length - 2} more
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="price-cell">{formatCurrency(product.sellingPrice)}</td>
                  <td className="cost-cell">{formatCurrency(product.estimatedCost)}</td>
                  <td className={`profit-cell ${product.estimatedProfit >= 0 ? 'positive' : 'negative'}`}>
                    {formatCurrency(product.estimatedProfit)}
                  </td>
                  <td className="time-cell">{formatTime(product.estimatedProductionTimeMinutes)}</td>
                  <td className="status-cell">
                    <div className="status-badges">
                      <span className={`status-badge ${product.isActive ? 'status-active' : 'status-inactive'}`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {product.isActive && (
                        <span className={`production-badge ${product.canProduce ? 'can-produce' : 'cannot-produce'}`}>
                          {product.canProduce ? 'Ready' : 'Not Ready'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>{formatDate(product.updatedAt)}</td>
                  <td className="actions-cell">
                    <div className="action-buttons">
                      <button 
                        className="action-button edit-button" 
                        title="Edit Product"
                        onClick={() => handleEditProduct(product)}
                      >
                        ✏️
                      </button>
                      <button 
                        className="action-button delete-button" 
                        title="Delete Product"
                        onClick={() => handleDeleteProduct(product)}
                      >
                        🗑️
                      </button>
                      <button 
                        className={`action-button produce-button ${!product.canProduce ? 'disabled' : ''}`}
                        title={product.canProduce ? "Produce Product" : "Cannot produce - missing materials"}
                        onClick={() => product.canProduce && handleProduceProduct(product)}
                        disabled={!product.canProduce}
                      >
                        🏭
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddProduct
          onClose={() => setShowAddModal(false)}
          onProductCreated={handleProductCreated}
        />
      )}

      {showEditModal && selectedProduct && (
        <EditProduct
          product={selectedProduct}
          onClose={closeModals}
          onProductUpdated={handleProductUpdated}
        />
      )}

      {showDeleteModal && selectedProduct && (
        <DeleteProductConfirmation
          product={selectedProduct}
          onClose={closeModals}
          onProductDeleted={handleProductDeleted}
        />
      )}

      {showProductionModal && selectedProduct && (
        <ProductionModal
          product={selectedProduct}
          onClose={closeModals}
          onProductionCompleted={handleProductionCompleted}
        />
      )}
    </div>
  );
};

export default Production;
