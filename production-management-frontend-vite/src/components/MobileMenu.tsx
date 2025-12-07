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
  X
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePermissions, Permissions } from '../hooks/usePermissions';
import LanguageSwitcher from './LanguageSwitcher';
import './MobileMenu.css';

interface MobileMenuProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  userRole: string;
  onClose: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  requiredPermission?: string;
}

const MobileMenu: React.FC<MobileMenuProps> = ({
  currentPage,
  onNavigate,
  userRole,
  onClose
}) => {
  const { hasPermission } = usePermissions();
  const { t } = useTranslation('navigation');

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: t('menu.dashboard'),
      icon: BarChart3
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

  const handleItemClick = (pageId: string) => {
    onNavigate(pageId);
    onClose();
  };

  return (
    <div className="mobile-menu" onClick={onClose}>
      <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
        <div className="mobile-menu-header">
          <h2>RodutPlast</h2>
          <button 
            className="mobile-menu-close"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>
        
        <nav className="mobile-menu-nav">
          <ul className="mobile-menu-list">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id} className="mobile-menu-item">
                  <button
                    className={`mobile-menu-button ${
                      currentPage === item.id ? 'active' : ''
                    }`}
                    onClick={() => handleItemClick(item.id)}
                  >
                    <Icon size={20} className="mobile-menu-icon" />
                    <span className="mobile-menu-label">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mobile-menu-footer">
          <LanguageSwitcher />
          <div className="mobile-menu-user-info">
            <span className="user-role-badge">{userRole}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
