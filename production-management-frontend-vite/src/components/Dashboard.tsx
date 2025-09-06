import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userApi, authApi } from '../services/api';
import type { User, DashboardData } from '../types.js';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Dashboard</h1>
          <div className="user-info">
            <span>Welcome, {user?.firstName} {user?.lastName}</span>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
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
      </main>
    </div>
  );
};

export default Dashboard;
