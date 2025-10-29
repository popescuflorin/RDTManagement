import React, { useState, useEffect } from 'react';
import { orderApi } from '../../services/api';
import type { Order, OrderStatistics } from '../../types';
import { OrderStatus } from '../../types';
import { Plus, Edit, Package, Search, Eye, Clock, Loader2, Truck, CheckCircle, BarChart3, XCircle, Play } from 'lucide-react';
import CreateOrder from './CreateOrder';
import ViewOrder from './ViewOrder';
import EditOrder from './EditOrder';
import ProcessOrder from './ProcessOrder';
import CancelOrderModal from './CancelOrderModal';
import './Orders.css';

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statistics, setStatistics] = useState<OrderStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [ordersResponse, statsResponse] = await Promise.all([
        orderApi.getAllOrders(),
        orderApi.getStatistics()
      ]);
      
      setOrders(ordersResponse.data);
      setStatistics(statsResponse.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load order data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrder = () => {
    setSelectedOrder(null);
    setShowCreateModal(true);
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowViewModal(true);
  };

  const handleEditOrder = (order: Order) => {
    if (order.status === OrderStatus.Draft) {
      setSelectedOrder(order);
      setShowEditModal(true);
    }
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSelectedOrder(null);
    loadData();
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedOrder(null);
  };

  const handleCancelOrder = (order: Order) => {
    // Can cancel any order except delivered or already cancelled
    if (order.status !== OrderStatus.Delivered && order.status !== OrderStatus.Cancelled) {
      setSelectedOrder(order);
      setShowCancelModal(true);
    }
  };

  const handleConfirmCancel = async () => {
    if (!selectedOrder) return;

    setIsCancelling(true);
    try {
      await orderApi.cancelOrder(selectedOrder.id);
      await loadData();
      setShowCancelModal(false);
      setSelectedOrder(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCloseCancelModal = () => {
    setShowCancelModal(false);
    setSelectedOrder(null);
  };

  const handleProcessOrder = (order: Order) => {
    // Can process draft or pending orders
    if (order.status === OrderStatus.Draft || order.status === OrderStatus.Pending) {
      setSelectedOrder(order);
      setShowProcessModal(true);
    }
  };

  const handleProcessSuccess = () => {
    setShowProcessModal(false);
    setSelectedOrder(null);
    loadData();
  };

  const handleCloseProcessModal = () => {
    setShowProcessModal(false);
    setSelectedOrder(null);
  };

  const getStatusBadge = (status: OrderStatus) => {
    const statusConfig = {
      [OrderStatus.Draft]: { label: 'Draft', className: 'status-draft' },
      [OrderStatus.Pending]: { label: 'Pending', className: 'status-pending' },
      [OrderStatus.Processing]: { label: 'Processing', className: 'status-processing' },
      [OrderStatus.Shipped]: { label: 'Shipped', className: 'status-shipped' },
      [OrderStatus.Delivered]: { label: 'Delivered', className: 'status-delivered' },
      [OrderStatus.Cancelled]: { label: 'Cancelled', className: 'status-cancelled' }
    };

    const config = statusConfig[status];
    return <span className={`status-badge ${config.className}`}>{config.label}</span>;
  };

  const filteredOrders = orders
    .filter(order => {
      const matchesSearch = order.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           order.clientEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           order.clientPhone?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="orders-loading">
        <Loader2 size={32} className="animate-spin" />
        <p>Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="orders-container">
      <div className="orders-header">
        <h1>
          <Package size={24} style={{ marginRight: '12px', verticalAlign: 'middle' }} />
          Orders
        </h1>
        <button 
          className="btn btn-primary"
          onClick={handleCreateOrder}
        >
          <Plus size={16} />
          Create New Order
        </button>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="orders-stats">
          <div className="stat-card">
            <div className="stat-icon">
              <Package size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{statistics.totalOrders}</div>
              <div className="stat-label">Total Orders</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Edit size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{statistics.draftOrders}</div>
              <div className="stat-label">Draft</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Clock size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{statistics.pendingOrders}</div>
              <div className="stat-label">Pending</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Loader2 size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{statistics.processingOrders}</div>
              <div className="stat-label">Processing</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Truck size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{statistics.shippedOrders}</div>
              <div className="stat-label">Shipped</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <CheckCircle size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{statistics.deliveredOrders}</div>
              <div className="stat-label">Delivered</div>
            </div>
          </div>
          <div className="stat-card stat-card-primary">
            <div className="stat-icon">
              <BarChart3 size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{formatCurrency(statistics.totalOrderValue)}</div>
              <div className="stat-label">Total Value</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="orders-controls">
        <div className="search-container">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by client name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-container">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value={OrderStatus.Draft}>Draft</option>
            <option value={OrderStatus.Pending}>Pending</option>
            <option value={OrderStatus.Processing}>Processing</option>
            <option value={OrderStatus.Shipped}>Shipped</option>
            <option value={OrderStatus.Delivered}>Delivered</option>
            <option value={OrderStatus.Cancelled}>Cancelled</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Orders Table */}
      <div className="table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Client Name</th>
              <th>Contact</th>
              <th>Order Date</th>
              <th>Expected Delivery</th>
              <th>Items</th>
              <th>Total Value</th>
              <th>Transport</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={10} className="no-data">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'No orders found matching your criteria' 
                    : 'No orders found. Create your first order!'}
                </td>
              </tr>
            ) : (
              filteredOrders.map(order => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>
                    <div className="client-name">{order.clientName}</div>
                    {order.clientCity && (
                      <div className="client-location">{order.clientCity}, {order.clientCountry || ''}</div>
                    )}
                  </td>
                  <td>
                    {order.clientEmail && <div className="contact-info">{order.clientEmail}</div>}
                    {order.clientPhone && <div className="contact-info">{order.clientPhone}</div>}
                  </td>
                  <td>{formatDate(order.orderDate)}</td>
                  <td>
                    {order.expectedDeliveryDate ? formatDate(order.expectedDeliveryDate) : '—'}
                  </td>
                  <td>{order.orderMaterials.length} item(s)</td>
                  <td className="currency-cell">{formatCurrency(order.totalValue)}</td>
                  <td>
                    {order.transportCarName ? (
                      <div className="transport-info">
                        <div>{order.transportCarName}</div>
                        {order.transportPhoneNumber && (
                          <div className="transport-phone">{order.transportPhoneNumber}</div>
                        )}
                      </div>
                    ) : '—'}
                  </td>
                  <td>{getStatusBadge(order.status)}</td>
                  <td className="actions-cell">
                    <div className="action-buttons">
                      <button
                        className="btn btn-sm btn-info"
                        title="View Order"
                        onClick={() => handleViewOrder(order)}
                      >
                        <Eye size={16} />
                      </button>
                      {order.status === OrderStatus.Draft && (
                        <button
                          className="btn btn-sm btn-primary"
                          title="Edit Order"
                          onClick={() => handleEditOrder(order)}
                        >
                          <Edit size={16} />
                        </button>
                      )}
                      {(order.status === OrderStatus.Draft || order.status === OrderStatus.Pending) && (
                        <button
                          className="btn btn-sm btn-success"
                          title="Process Order"
                          onClick={() => handleProcessOrder(order)}
                        >
                          <Play size={16} />
                        </button>
                      )}
                      {order.status !== OrderStatus.Delivered && order.status !== OrderStatus.Cancelled && (
                        <button
                          className="btn btn-sm btn-danger"
                          title="Cancel Order"
                          onClick={() => handleCancelOrder(order)}
                        >
                          <XCircle size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateOrder
          onClose={() => setShowCreateModal(false)}
          onOrderCreated={loadData}
        />
      )}

      {showEditModal && selectedOrder && (
        <EditOrder
          isOpen={showEditModal}
          onClose={handleCloseEditModal}
          onSuccess={handleEditSuccess}
          order={selectedOrder}
        />
      )}

      {showProcessModal && selectedOrder && (
        <ProcessOrder
          order={selectedOrder}
          onClose={handleCloseProcessModal}
          onSuccess={handleProcessSuccess}
        />
      )}

      {showViewModal && selectedOrder && (
        <ViewOrder
          order={selectedOrder}
          onClose={() => {
            setShowViewModal(false);
            setSelectedOrder(null);
          }}
        />
      )}

      {showCancelModal && selectedOrder && (
        <CancelOrderModal
          order={selectedOrder}
          onClose={handleCloseCancelModal}
          onConfirm={handleConfirmCancel}
          isLoading={isCancelling}
        />
      )}
    </div>
  );
};

export default Orders;

