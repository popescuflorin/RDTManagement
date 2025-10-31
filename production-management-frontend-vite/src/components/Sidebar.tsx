import React, { useState } from 'react';
import { 
  BarChart3, 
  Users, 
  Factory, 
  Package, 
  ShoppingCart,
  ClipboardList, 
  TrendingUp, 
  Settings, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';
import { usePermissions, Permissions } from '../hooks/usePermissions';
import './Sidebar.css';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
  userRole: string;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  requiredPermission?: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggle,
  currentPage,
  onNavigate,
  userRole
}) => {
  const { hasPermission } = usePermissions();

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3
      // Dashboard is accessible to everyone
    },
    {
      id: 'users',
      label: 'User Management',
      icon: Users,
      requiredPermission: Permissions.ViewUsersTab
    },
    {
      id: 'acquisitions',
      label: 'Acquisitions',
      icon: ShoppingCart,
      requiredPermission: Permissions.ViewAcquisitionsTab
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: Package,
      requiredPermission: Permissions.ViewInventoryTab
    },
    {
      id: 'production',
      label: 'Production',
      icon: Factory,
      requiredPermission: Permissions.ViewProductionTab
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: ClipboardList,
      requiredPermission: Permissions.ViewOrdersTab
    }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    !item.requiredPermission || hasPermission(item.requiredPermission)
  );

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : 'expanded'}`}>
      <div className="sidebar-header">
        <button 
          className="sidebar-toggle"
          onClick={onToggle}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
        {!isCollapsed && (
          <h2 className="sidebar-title">Production Management</h2>
        )}
      </div>

      <nav className="sidebar-nav">
        <ul className="sidebar-menu">
          {filteredMenuItems.map((item) => (
            <li key={item.id} className="sidebar-menu-item">
              <button
                className={`sidebar-menu-button ${
                  currentPage === item.id ? 'active' : ''
                }`}
                onClick={() => onNavigate(item.id)}
                title={isCollapsed ? item.label : undefined}
              >
                <span className="sidebar-icon">
                  <item.icon size={20} />
                </span>
                {!isCollapsed && (
                  <span className="sidebar-label">{item.label}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {!isCollapsed && (
        <div className="sidebar-footer">
          <div className="sidebar-user-info">
            <span className="user-role-badge">{userRole}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
