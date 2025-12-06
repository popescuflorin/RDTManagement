import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  UserCheck, 
  Activity, 
  UserPlus, 
  LogOut, 
  Clock,
  Mail,
  User as UserIcon
} from 'lucide-react';
import { userApi, authApi, clearAuthData } from '../services/api';
import type { User, DashboardData } from '../types';
import AdminRegister from './users/AdminRegister';
import Sidebar from './Sidebar';
import UserManagement from './users/UserManagement';
import Inventory from './inventory/Inventory';
import Production from './production/Production';
import AcquisitionPage from './acquisitions/Acquisition';
import Orders from './orders/Orders';
import Transports from './transports/Transports';
import Clients from './clients/Clients';
import Suppliers from './suppliers/Suppliers';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { t } = useTranslation(['dashboard', 'common']);
  const [user, setUser] = useState<User | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const navigate = useNavigate();

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Load user profile
        const userResponse = await userApi.getProfile();
        setUser(userResponse.data);
        
        // Load dashboard data
        const dashboardResponse = await userApi.getDashboard();
        setDashboardData(dashboardResponse.data);
      } catch (err: any) {
        // Check if it's an authentication error
        if (err.response?.status === 401) {
          // Token is invalid or expired, clear data and redirect
          clearAuthData();
          navigate('/login');
        } else {
          setError(err.response?.data?.message || t('dashboard.error.failedToLoad'));
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Clear all authentication data
      clearAuthData();
      navigate('/login');
    }
  };

  const handleUserCreated = (newUser: User) => {
    console.log('New user created:', newUser);
    // Optionally refresh dashboard data or show success message
  };

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    // Handle other page navigation here
  };

  const getPageTitle = (page: string): string => {
    const pageKey = `pages.${page}`;
    const translated = t(pageKey, { ns: 'dashboard' });
    // If translation key doesn't exist, return capitalized page name
    if (translated === pageKey) {
      return page.charAt(0).toUpperCase() + page.slice(1);
    }
    return translated;
  };

  const renderPageContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return renderDashboardContent();
      case 'users':
        return <UserManagement />;
      case 'production':
        return <Production />;
      case 'inventory':
        return <Inventory />;
      case 'acquisitions':
        return <AcquisitionPage />;
      case 'orders':
        return <Orders />;
      case 'transports':
        return <Transports />;
      case 'clients':
        return <Clients />;
      case 'suppliers':
        return <Suppliers />;
      default:
        return renderDashboardContent();
    }
  };

  const renderDashboardContent = () => {
    if (!dashboardData) return null;
    
    return (
      <>
        <div className="welcome-section">
          <h2>{dashboardData?.welcomeMessage}</h2>
          <p>
            <Clock size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            {t('content.lastLogin', { ns: 'dashboard' })} {new Date(user?.lastLoginAt || '').toLocaleString()}
          </p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <Users size={24} />
            </div>
            <h3>{t('content.totalUsers', { ns: 'dashboard' })}</h3>
            <div className="stat-value">{dashboardData?.totalUsers}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <UserCheck size={24} />
            </div>
            <h3>{t('content.activeUsers', { ns: 'dashboard' })}</h3>
            <div className="stat-value">{dashboardData?.activeUsers}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Activity size={24} />
            </div>
            <h3>{t('content.systemStatus', { ns: 'dashboard' })}</h3>
            <div className="stat-value status-ok">{dashboardData?.systemStatus}</div>
          </div>
        </div>

        <div className="activity-section">
          <h3>{t('content.recentActivity', { ns: 'dashboard' })}</h3>
          <div className="activity-list">
            {dashboardData?.recentActivity.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-dot"></div>
                <span>{activity}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="user-profile-section">
          <h3>{t('content.profileInformation', { ns: 'dashboard' })}</h3>
          <div className="profile-info">
            <div className="profile-item">
              <label>
                <UserIcon size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                {t('content.username', { ns: 'dashboard' })}
              </label>
              <span>{user?.username}</span>
            </div>
            <div className="profile-item">
              <label>
                <Mail size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                {t('content.email', { ns: 'dashboard' })}
              </label>
              <span>{user?.email}</span>
            </div>
            <div className="profile-item">
              <label>
                <UserIcon size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                {t('content.fullName', { ns: 'dashboard' })}
              </label>
              <span>{user?.firstName} {user?.lastName}</span>
            </div>
          </div>
        </div>
      </>
    );
  };

  const isAdmin = user?.role === 'Admin';

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <div className="loading">{t('loading.loadingDashboard', { ns: 'dashboard' })}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error">{t('error.error', { ns: 'dashboard', error })}</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggle={handleSidebarToggle}
        currentPage={currentPage}
        onNavigate={handleNavigate}
        userRole={user?.role || 'User'}
      />
      
      <div className={`dashboard-content ${sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
      <header className="dashboard-header">
        <div className="header-content">
          <h1>{getPageTitle(currentPage)}</h1>
          <div className="user-info">
            <span>{t('header.welcome', { ns: 'dashboard', firstName: user?.firstName, lastName: user?.lastName, role: user?.role })}</span>
            {isAdmin && currentPage === 'dashboard' && (
              <button 
                onClick={() => setShowRegisterModal(true)} 
                className="btn btn-primary"
              >
                <UserPlus size={16} />
                {t('header.createUser', { ns: 'dashboard' })}
              </button>
            )}
            <button onClick={handleLogout} className="btn btn-danger">
              <LogOut size={16} />
              {t('header.logout', { ns: 'dashboard' })}
            </button>
          </div>
        </div>
      </header>

        <main className="dashboard-main">
          {renderPageContent()}
        </main>
      </div>

      {showRegisterModal && (
        <AdminRegister
          onClose={() => setShowRegisterModal(false)}
          onUserCreated={handleUserCreated}
        />
      )}
    </div>
  );
};

export default Dashboard;
