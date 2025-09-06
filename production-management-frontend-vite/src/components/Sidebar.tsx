import React, { useState } from 'react';
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
  icon: string;
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
      icon: '📊'
    },
    {
      id: 'users',
      label: 'User Management',
      icon: '👥',
      requiredRole: 'Admin'
    },
    {
      id: 'production',
      label: 'Production',
      icon: '🏭'
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: '📦'
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: '📋'
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: '📈'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️'
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
          {isCollapsed ? '▶️' : '◀️'}
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
                <span className="sidebar-icon">{item.icon}</span>
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
