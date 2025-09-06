import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userApi, authApi } from '../services/api';
import type { User, DashboardData } from '../types';
import AdminRegister from './AdminRegister';
import Sidebar from './Sidebar';
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
    if (page === 'users') {
      setShowRegisterModal(true);
    }
    // Handle other page navigation here
  };

  const renderPageContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return renderDashboardContent();
      case 'users':
        return <div className="page-content"><h2>User Management</h2><p>User management functionality will be implemented here.</p></div>;
      case 'production':
        return <div className="page-content"><h2>Production</h2><p>Production management functionality will be implemented here.</p></div>;
      case 'inventory':
        return <div className="page-content"><h2>Inventory</h2><p>Inventory management functionality will be implemented here.</p></div>;
      case 'orders':
        return <div className="page-content"><h2>Orders</h2><p>Order management functionality will be implemented here.</p></div>;
      case 'reports':
        return <div className="page-content"><h2>Reports</h2><p>Reports functionality will be implemented here.</p></div>;
      case 'settings':
        return <div className="page-content"><h2>Settings</h2><p>Settings functionality will be implemented here.</p></div>;
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
          <p>Last login: {new Date(user?.lastLoginAt || '').toLocaleString()}</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Users</h3>
            <div className="stat-value">{dashboardData?.totalUsers}</div>
          </div>
          <div className="stat-card">
            <h3>Active Users</h3>
            <div className="stat-value">{dashboardData?.activeUsers}</div>
          </div>
          <div className="stat-card">
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
              <label>Username:</label>
              <span>{user?.username}</span>
            </div>
            <div className="profile-item">
              <label>Email:</label>
              <span>{user?.email}</span>
            </div>
            <div className="profile-item">
              <label>Full Name:</label>
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
                className="create-user-button"
              >
                Create User
              </button>
            )}
            <button onClick={handleDebugClaims} style={{marginLeft: '10px'}}>
              Debug Claims
            </button>
            <button onClick={handleLogout} className="logout-button">
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
