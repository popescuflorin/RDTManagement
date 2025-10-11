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
  requiredRole?: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggle,
  currentPage,
  onNavigate,
  userRole
}) => {
  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3
    },
    {
      id: 'users',
      label: 'User Management',
      icon: Users,
      requiredRole: 'Admin'
    },
    {
      id: 'acquisitions',
      label: 'Acquisitions',
      icon: ShoppingCart
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: Package
    },
    {
      id: 'production',
      label: 'Production',
      icon: Factory
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: ClipboardList
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: TrendingUp
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings
    }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    !item.requiredRole || item.requiredRole === userRole
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
