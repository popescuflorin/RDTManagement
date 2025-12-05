import React from 'react';
import { 
  BarChart3, 
  Users, 
  Factory, 
  Package, 
  ShoppingCart,
  ClipboardList,
  Truck,
  UserCircle,
  Building2,
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePermissions, Permissions } from '../hooks/usePermissions';
import LanguageSwitcher from './LanguageSwitcher';
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
  const { t } = useTranslation('navigation');

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: t('menu.dashboard'),
      icon: BarChart3
      // Dashboard is accessible to everyone
    },
    {
      id: 'users',
      label: t('menu.users'),
      icon: Users,
      requiredPermission: Permissions.ViewUsersTab
    },
    {
      id: 'acquisitions',
      label: t('menu.acquisitions'),
      icon: ShoppingCart,
      requiredPermission: Permissions.ViewAcquisitionsTab
    },
    {
      id: 'inventory',
      label: t('menu.inventory'),
      icon: Package,
      requiredPermission: Permissions.ViewInventoryTab
    },
    {
      id: 'production',
      label: t('menu.production'),
      icon: Factory,
      requiredPermission: Permissions.ViewProductionTab
    },
    {
      id: 'orders',
      label: t('menu.orders'),
      icon: ClipboardList,
      requiredPermission: Permissions.ViewOrdersTab
    },
    {
      id: 'transports',
      label: t('menu.transports'),
      icon: Truck,
      requiredPermission: Permissions.ViewTransportsTab
    },
    {
      id: 'clients',
      label: t('menu.clients'),
      icon: UserCircle,
      requiredPermission: Permissions.ViewClientsTab
    },
    {
      id: 'suppliers',
      label: t('menu.suppliers'),
      icon: Building2,
      requiredPermission: Permissions.ViewSuppliersTab
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
          <LanguageSwitcher />
          <div className="sidebar-user-info">
            <span className="user-role-badge">{userRole}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
