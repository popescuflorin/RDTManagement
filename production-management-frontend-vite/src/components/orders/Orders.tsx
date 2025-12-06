import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { orderApi, inventoryApi } from '../../services/api';
import type { Order, OrderStatistics, RawMaterial, PagedResult } from '../../types';
import { OrderStatus } from '../../types';
import { Plus, Edit, Package, Search, Filter, Clock, Loader2, Truck, CheckCircle, BarChart3, Play, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import CreateOrder from './CreateOrder';
import ViewOrder from './ViewOrder';
import EditOrder from './EditOrder';
import ProcessOrder from './ProcessOrder';
import CancelOrderModal from './CancelOrderModal';
import ProtectedButton from '../ProtectedButton';
import { Permissions } from '../../hooks/usePermissions';
import EditButton from '../atoms/EditButton';
import ViewButton from '../atoms/ViewButton';
import CancelButton from '../atoms/CancelButton';
import './Orders.css';

const Orders: React.FC = () => {
  const { t } = useTranslation(['orders', 'common']);
  const [pagedData, setPagedData] = useState<PagedResult<Order> | null>(null);
  const [statistics, setStatistics] = useState<OrderStatistics | null>(null);
  const [inventory, setInventory] = useState<RawMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination and filtering state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | null>(null);
  const [sortBy, setSortBy] = useState<string>('CreatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    loadData();
  }, [currentPage, pageSize, searchTerm, statusFilter, sortBy, sortOrder]);
  
  // Load inventory separately (not paginated, needed for stock checking)
  useEffect(() => {
    const loadInventory = async () => {
      try {
        const response = await inventoryApi.getAllMaterialsIncludingInactive();
        setInventory(response.data);
      } catch (err: any) {
        console.error('Failed to load inventory:', err);
      }
    };
    loadInventory();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [pagedResponse, statsResponse] = await Promise.all([
        orderApi.getOrdersPaged({
          page: currentPage,
          pageSize: pageSize,
          searchTerm: searchTerm || undefined,
          status: statusFilter ?? undefined,
          sortBy: sortBy,
          sortOrder: sortOrder
        }),
        orderApi.getStatistics()
      ]);
      
      setPagedData(pagedResponse.data);
      setStatistics(statsResponse.data);
    } catch (err: any) {
      setError(err.response?.data?.message || t('common:messages.error'));
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

  const handleSort = (column: string) => {
    if (sortBy === column) {
      // Toggle sort order if clicking the same column
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to descending
      setSortBy(column);
      setSortOrder('desc');
    }
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) {
      return <ArrowUpDown size={14} className="sort-icon inactive" />;
    }
    return sortOrder === 'asc' 
      ? <ArrowUp size={14} className="sort-icon active" />
      : <ArrowDown size={14} className="sort-icon active" />;
  };

  const getStatusBadge = (status: OrderStatus) => {
    const statusConfig = {
      [OrderStatus.Draft]: { label: t('status.draft'), className: 'status-draft' },
      [OrderStatus.Pending]: { label: t('status.pending'), className: 'status-pending' },
      [OrderStatus.Processing]: { label: t('status.processing'), className: 'status-processing' },
      [OrderStatus.Shipped]: { label: t('status.shipped'), className: 'status-shipped' },
      [OrderStatus.Delivered]: { label: t('status.delivered'), className: 'status-delivered' },
      [OrderStatus.Cancelled]: { label: t('status.cancelled'), className: 'status-cancelled' }
    };

    const config = statusConfig[status];
    return <span className={`status-badge ${config.className}`}>{config.label}</span>;
  };

  const orders = pagedData?.items || [];

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

  // Check if an order has sufficient inventory to be processed
  const hasInsufficientStock = (order: Order): { hasIssue: boolean; insufficientItems: string[] } => {
    const insufficientItems: string[] = [];
    
    for (const orderMaterial of order.orderMaterials) {
      const inventoryItem = inventory.find(inv => inv.id === orderMaterial.rawMaterialId);
      
      if (!inventoryItem) {
        insufficientItems.push(`${orderMaterial.materialName} (Not found in inventory)`);
        continue;
      }
      
      if (inventoryItem.quantity < orderMaterial.quantity) {
        insufficientItems.push(
          `${orderMaterial.materialName} (Need: ${orderMaterial.quantity}, Available: ${inventoryItem.quantity})`
        );
      }
    }
    
    return {
      hasIssue: insufficientItems.length > 0,
      insufficientItems
    };
  };

  if (isLoading) {
    return (
      <div className="orders-loading">
        <Loader2 size={32} className="animate-spin" />
        <p>{t('common:messages.loading')}</p>
      </div>
    );
  }

  return (
    <div className="orders-container">
      <div className="orders-header">
        <h1>
          <Package size={24} style={{ marginRight: '12px', verticalAlign: 'middle' }} />
          {t('title')}
        </h1>
        <ProtectedButton
          requiredPermission={Permissions.CreateOrder}
          className="btn btn-primary"
          onClick={handleCreateOrder}
        >
          <Plus size={16} />
          {t('createOrder')}
        </ProtectedButton>
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
              <div className="stat-label">{t('statistics.totalOrders')}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Edit size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{statistics.draftOrders}</div>
              <div className="stat-label">{t('statistics.draftOrders')}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Clock size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{statistics.pendingOrders}</div>
              <div className="stat-label">{t('statistics.pendingOrders')}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Loader2 size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{statistics.processingOrders}</div>
              <div className="stat-label">{t('statistics.processingOrders')}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Truck size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{statistics.shippedOrders}</div>
              <div className="stat-label">{t('statistics.shippedOrders')}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <CheckCircle size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{statistics.deliveredOrders}</div>
              <div className="stat-label">{t('statistics.deliveredOrders')}</div>
            </div>
          </div>
          <div className="stat-card stat-card-primary">
            <div className="stat-icon">
              <BarChart3 size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{formatCurrency(statistics.totalOrderValue)}</div>
              <div className="stat-label">{t('statistics.totalOrderValue')}</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="orders-controls">
        <div className="search-container">
          <div className="search-input-wrapper">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder={t('table.searchPlaceholder', { defaultValue: 'Search by client name, email, or phone...' })}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
              className="search-input"
            />
          </div>
        </div>
        
        {/* Status Filter */}
        <div className="filter-container">
          <Filter size={20} className="filter-icon" />
          <select
            value={statusFilter ?? ''}
            onChange={(e) => {
              setStatusFilter(e.target.value ? Number(e.target.value) as OrderStatus : null);
              setCurrentPage(1);
            }}
            className="filter-select"
          >
            <option value="">{t('table.allStatus', { defaultValue: 'All Status' })}</option>
            <option value={OrderStatus.Draft}>{t('status.draft')}</option>
            <option value={OrderStatus.Pending}>{t('status.pending')}</option>
            <option value={OrderStatus.Processing}>{t('status.processing')}</option>
            <option value={OrderStatus.Shipped}>{t('status.shipped')}</option>
            <option value={OrderStatus.Delivered}>{t('status.delivered')}</option>
            <option value={OrderStatus.Cancelled}>{t('status.cancelled')}</option>
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
              <th>{t('table.orderId')}</th>
              <th>{t('table.clientName')}</th>
              <th>{t('table.contact')}</th>
              <th className="sortable" onClick={() => handleSort('OrderDate')}>
                <div className="th-content">
                  <span>{t('orderDate')}</span>
                  {getSortIcon('OrderDate')}
                </div>
              </th>
              <th className="sortable" onClick={() => handleSort('ExpectedDeliveryDate')}>
                <div className="th-content">
                  <span>{t('expectedDeliveryDate')}</span>
                  {getSortIcon('ExpectedDeliveryDate')}
                </div>
              </th>
              <th>{t('items')}</th>
              <th>{t('totalValue')}</th>
              <th>{t('table.transport')}</th>
              <th>{t('assignedTo')}</th>
              <th className="sortable" onClick={() => handleSort('Status')}>
                <div className="th-content">
                  <span>{t('common:labels.status')}</span>
                  {getSortIcon('Status')}
                </div>
              </th>
              <th>{t('common:labels.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={11} className="no-data">
                  {searchTerm || statusFilter !== null 
                    ? t('table.noMatchingOrders')
                    : t('table.noOrders')}
                </td>
              </tr>
            ) : (
              orders.map(order => (
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
                  <td>{order.orderMaterials.length} {t('items', { defaultValue: 'item(s)' })}</td>
                  <td className="currency-cell">{formatCurrency(order.totalValue)}</td>
                  <td>
                    {order.transportCarName ? (
                      <div className="transport-info">
                        <div>{order.transportCarName}</div>
                        {order.transportNumberPlate && (
                          <div className="transport-number-plate">{order.transportNumberPlate}</div>
                        )}
                        {order.transportPhoneNumber && (
                          <div className="transport-phone">{order.transportPhoneNumber}</div>
                        )}
                      </div>
                    ) : '—'}
                  </td>
                  <td>{order.assignedToUserName || '—'}</td>
                  <td>{getStatusBadge(order.status)}</td>
                  <td className="actions-cell">
                    <div className="action-buttons">
                      <ViewButton
                        requiredPermission={Permissions.ViewOrder}
                        title={t('viewOrder')}
                        onClick={() => handleViewOrder(order)}
                      />
                      {order.status === OrderStatus.Draft && (
                        <EditButton
                          requiredPermission={Permissions.EditOrder}
                          title={t('editOrder')}
                          onClick={() => handleEditOrder(order)}
                        />
                      )}
                      {(order.status === OrderStatus.Draft || order.status === OrderStatus.Pending) && (() => {
                        const stockCheck = hasInsufficientStock(order);
                        const isDisabled = stockCheck.hasIssue;
                        const title = isDisabled 
                          ? `${t('messages.insufficientStock')}:\n${stockCheck.insufficientItems.join('\n')}`
                          : t('processOrder');
                        
                        return (
                          <ProtectedButton
                            requiredPermission={Permissions.ProcessOrder}
                            className={`btn btn-sm ${isDisabled ? 'btn-secondary' : 'btn-success'}`}
                            title={title}
                            onClick={() => !isDisabled && handleProcessOrder(order)}
                            disabled={isDisabled}
                            style={isDisabled ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
                          >
                            <Play size={16} />
                          </ProtectedButton>
                        );
                      })()}
                      {order.status !== OrderStatus.Delivered && order.status !== OrderStatus.Cancelled && (
                        <CancelButton
                          requiredPermission={Permissions.CancelOrder}
                          title={t('cancelOrder')}
                          onClick={() => handleCancelOrder(order)}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {pagedData && pagedData.totalPages > 0 && (
        <div className="pagination-container">
          <div className="pagination-info">
            {t('table.paginationInfo', { 
              start: ((pagedData.page - 1) * pagedData.pageSize) + 1,
              end: Math.min(pagedData.page * pagedData.pageSize, pagedData.totalCount),
              total: pagedData.totalCount
            })}
          </div>
          
          <div className="pagination-controls">
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(1)}
              disabled={!pagedData.hasPreviousPage}
            >
              {t('common:buttons.first')}
            </button>
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={!pagedData.hasPreviousPage}
            >
              <ChevronLeft size={16} />
              {t('common:buttons.previous')}
            </button>
            
            <div className="pagination-pages">
              {Array.from({ length: Math.min(5, pagedData.totalPages) }, (_, i) => {
                let pageNum;
                if (pagedData.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= pagedData.totalPages - 2) {
                  pageNum = pagedData.totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    className={`pagination-page ${currentPage === pageNum ? 'active' : ''}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={!pagedData.hasNextPage}
            >
              {t('common:buttons.next')}
              <ChevronRight size={16} />
            </button>
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(pagedData.totalPages)}
              disabled={!pagedData.hasNextPage}
            >
              {t('common:buttons.last')}
            </button>
          </div>
          
          <div className="page-size-selector">
            <label>{t('table.show', { defaultValue: 'Show:' })}</label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>{t('table.perPage', { defaultValue: 'per page' })}</span>
          </div>
        </div>
      )}

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

