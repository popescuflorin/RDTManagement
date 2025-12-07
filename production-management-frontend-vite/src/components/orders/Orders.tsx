import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { orderApi, inventoryApi } from '../../services/api';
import type { Order, OrderStatistics, RawMaterial, PagedResult } from '../../types';
import { OrderStatus } from '../../types';
import { Package, Filter, Clock, Loader2, Truck, CheckCircle, BarChart3, Play, Edit } from 'lucide-react';
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
import CreateButton from '../atoms/CreateButton';
import { Table, PageContainer, Loader, SearchInput, Pagination, ErrorMessage } from '../atoms';
import type { TableColumn } from '../atoms';
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

  const handleSort = (column: string, order: 'asc' | 'desc') => {
    setSortBy(column);
    setSortOrder(order);
    setCurrentPage(1); // Reset to first page when sorting changes
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
      currency: 'RON'
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
      <PageContainer>
        <Loader message={t('common:messages.loading')} />
      </PageContainer>
    );
  }

  return (
    <div className="orders-container">
      <div className="orders-header">
        <h1>
          <Package size={24} style={{ marginRight: '12px', verticalAlign: 'middle' }} />
          {t('title')}
        </h1>
        <CreateButton
          onClick={handleCreateOrder}
          requiredPermission={Permissions.CreateOrder}
          variant="primary"
        >
          {t('createOrder')}
        </CreateButton>
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
        <SearchInput
          placeholder={t('table.searchPlaceholder', { defaultValue: 'Search by client name, email, or phone...' })}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1); // Reset to first page on search
          }}
        />
        
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
        <ErrorMessage
          message={error}
          onDismiss={() => setError(null)}
        />
      )}

      {/* Orders Table */}
      {(() => {
        const columns: TableColumn<Order>[] = [
          {
            key: 'id',
            label: t('table.orderId'),
            render: (_, order) => `#${order.id}`
          },
          {
            key: 'clientName',
            label: t('table.clientName'),
            render: (_, order) => (
              <>
                <div className="client-name">{order.clientName}</div>
                {order.clientCity && (
                  <div className="client-location">{order.clientCity}, {order.clientCountry || ''}</div>
                )}
              </>
            )
          },
          {
            key: 'contact',
            label: t('table.contact'),
            render: (_, order) => (
              <>
                {order.clientEmail && <div className="contact-info">{order.clientEmail}</div>}
                {order.clientPhone && <div className="contact-info">{order.clientPhone}</div>}
              </>
            )
          },
          {
            key: 'OrderDate',
            label: t('orderDate'),
            sortable: true,
            render: (_, order) => formatDate(order.orderDate)
          },
          {
            key: 'ExpectedDeliveryDate',
            label: t('expectedDeliveryDate'),
            sortable: true,
            render: (_, order) => order.expectedDeliveryDate ? formatDate(order.expectedDeliveryDate) : '—'
          },
          {
            key: 'items',
            label: t('items'),
            render: (_, order) => `${order.orderMaterials.length} ${t('items', { defaultValue: 'item(s)' })}`
          },
          {
            key: 'totalValue',
            label: t('totalValue'),
            render: (_, order) => <span className="currency-cell">{formatCurrency(order.totalValue)}</span>
          },
          {
            key: 'transport',
            label: t('table.transport'),
            render: (_, order) => (
              order.transportCarName ? (
                <div className="transport-info">
                  <div>{order.transportCarName}</div>
                  {order.transportNumberPlate && (
                    <div className="transport-number-plate">{order.transportNumberPlate}</div>
                  )}
                  {order.transportPhoneNumber && (
                    <div className="transport-phone">{order.transportPhoneNumber}</div>
                  )}
                </div>
              ) : '—'
            )
          },
          {
            key: 'assignedTo',
            label: t('assignedTo'),
            render: (_, order) => order.assignedToUserName || '—'
          },
          {
            key: 'Status',
            label: t('common:labels.status'),
            sortable: true,
            render: (_, order) => getStatusBadge(order.status)
          },
          {
            key: 'actions',
            label: t('common:labels.actions'),
            render: (_, order) => (
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
            ),
            cellClassName: 'actions-cell'
          }
        ];

        return (
          <Table
            columns={columns}
            data={orders}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            emptyMessage={searchTerm || statusFilter !== null 
              ? t('table.noMatchingOrders')
              : t('table.noOrders')}
          />
        );
      })()}

      {/* Pagination Controls */}
      {pagedData && pagedData.totalPages > 0 && (
        <Pagination
          data={pagedData}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          labels={{
            showing: t('table.paginationInfo', { 
              start: ((pagedData.page - 1) * pagedData.pageSize) + 1,
              end: Math.min(pagedData.page * pagedData.pageSize, pagedData.totalCount),
              total: pagedData.totalCount
            }),
            first: t('common:buttons.first'),
            previous: t('common:buttons.previous'),
            next: t('common:buttons.next'),
            last: t('common:buttons.last'),
            show: t('table.show', { defaultValue: 'Show:' }),
            perPage: t('table.perPage', { defaultValue: 'per page' })
          }}
        />
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateOrder
          isOpen={showCreateModal}
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
          isOpen={showProcessModal}
          order={selectedOrder}
          onClose={handleCloseProcessModal}
          onSuccess={handleProcessSuccess}
        />
      )}

      {showViewModal && selectedOrder && (
        <ViewOrder
          isOpen={showViewModal}
          order={selectedOrder}
          onClose={() => {
            setShowViewModal(false);
            setSelectedOrder(null);
          }}
        />
      )}

      {showCancelModal && selectedOrder && (
        <CancelOrderModal
          isOpen={showCancelModal}
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

