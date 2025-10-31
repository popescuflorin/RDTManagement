import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  UserCheck, 
  Activity, 
  UserPlus, 
  LogOut, 
  Bug,
  Clock,
  Mail,
  User as UserIcon
} from 'lucide-react';
import { userApi, authApi } from '../services/api';
import type { User, DashboardData } from '../types';
import AdminRegister from './users/AdminRegister';
import Sidebar from './Sidebar';
import UserManagement from './users/UserManagement';
import Inventory from './inventory/Inventory';
import Production from './production/Production';
import AcquisitionPage from './acquisitions/Acquisition';
import Orders from './orders/Orders';
import './Dashboard.css';

const Dashboard: React.FC = () => {
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
        setError(err.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  const handleUserCreated = (newUser: User) => {
    console.log('New user created:', newUser);
    // Optionally refresh dashboard data or show success message
  };

  const handleDebugClaims = async () => {
    try {
      const response = await authApi.debugClaims();
      console.log('JWT Claims:', response.data);
      alert('Check console for JWT claims');
    } catch (error) {
      console.error('Error getting claims:', error);
    }
  };

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    // Handle other page navigation here
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
            Last login: {new Date(user?.lastLoginAt || '').toLocaleString()}
          </p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <Users size={24} />
            </div>
            <h3>Total Users</h3>
            <div className="stat-value">{dashboardData?.totalUsers}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <UserCheck size={24} />
            </div>
            <h3>Active Users</h3>
            <div className="stat-value">{dashboardData?.activeUsers}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Activity size={24} />
            </div>
            <h3>System Status</h3>
            <div className="stat-value status-ok">{dashboardData?.systemStatus}</div>
          </div>
        </div>

        <div className="activity-section">
          <h3>Recent Activity</h3>
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
          <h3>Profile Information</h3>
          <div className="profile-info">
            <div className="profile-item">
              <label>
                <UserIcon size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                Username:
              </label>
              <span>{user?.username}</span>
            </div>
            <div className="profile-item">
              <label>
                <Mail size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                Email:
              </label>
              <span>{user?.email}</span>
            </div>
            <div className="profile-item">
              <label>
                <UserIcon size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                Full Name:
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
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error">Error: {error}</div>
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
          <h1>{currentPage === 'dashboard' ? 'Dashboard' : currentPage.charAt(0).toUpperCase() + currentPage.slice(1)}</h1>
          <div className="user-info">
            <span>Welcome, {user?.firstName} {user?.lastName} ({user?.role})</span>
            {isAdmin && currentPage === 'dashboard' && (
              <button 
                onClick={() => setShowRegisterModal(true)} 
                className="btn btn-primary"
              >
                <UserPlus size={16} />
                Create User
              </button>
            )}
            <button 
              onClick={handleDebugClaims} 
              className="btn btn-secondary"
            >
              <Bug size={16} />
              Debug Claims
            </button>
            <button onClick={handleLogout} className="btn btn-danger">
              <LogOut size={16} />
              Logout
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
