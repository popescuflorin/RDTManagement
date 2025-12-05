import { useState, useEffect } from 'react';
import type { User } from '../types';

export const Permissions = {
  // Acquisitions
  ViewAcquisitionsTab: 'Acquisitions.ViewTab',
  CreateAcquisition: 'Acquisitions.Create',
  ViewAcquisition: 'Acquisitions.View',
  EditAcquisition: 'Acquisitions.Edit',
  CancelAcquisition: 'Acquisitions.Cancel',
  ReceiveAcquisition: 'Acquisitions.Receive',
  ProcessAcquisition: 'Acquisitions.Process',

  // Inventory
  ViewInventoryTab: 'Inventory.ViewTab',
  AddMaterial: 'Inventory.Add',
  EditMaterial: 'Inventory.Edit',
  ViewMaterial: 'Inventory.View',
  DeactivateMaterial: 'Inventory.Deactivate',
  ActivateMaterial: 'Inventory.Activate',

  // Production
  ViewProductionTab: 'Production.ViewTab',
  CreateProductionPlan: 'Production.Create',
  EditProductionPlan: 'Production.Edit',
  ViewProductionPlan: 'Production.View',
  CancelProductionPlan: 'Production.Cancel',
  ExecuteProductionPlan: 'Production.Execute',
  ReceiveProduction: 'Production.Receive',

  // Orders
  ViewOrdersTab: 'Orders.ViewTab',
  CreateOrder: 'Orders.Create',
  EditOrder: 'Orders.Edit',
  ViewOrder: 'Orders.View',
  CancelOrder: 'Orders.Cancel',
  ProcessOrder: 'Orders.Process',

  // Users
  ViewUsersTab: 'Users.ViewTab',
  CreateUser: 'Users.Create',
  EditUser: 'Users.Edit',
  ViewUser: 'Users.View',
  DeactivateUser: 'Users.Deactivate',
  ActivateUser: 'Users.Activate',

  // Transport
  ViewTransportsTab: 'Transports.ViewTab',
  CreateTransport: 'Transports.Create',
  ViewTransport: 'Transports.View',
  EditTransport: 'Transports.Edit',
  DeleteTransport: 'Transports.Delete',

  // Clients
  ViewClientsTab: 'Clients.ViewTab',
  CreateClient: 'Clients.Create',
  ViewClient: 'Clients.View',
  EditClient: 'Clients.Edit',
  DeleteClient: 'Clients.Delete',

  // Roles
  ViewRolesTab: 'Roles.ViewTab',
  ManageRolePermissions: 'Roles.ManagePermissions',
} as const;

export const usePermissions = () => {
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Load user from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData: User = JSON.parse(userStr);
        setUser(userData);
        setUserPermissions(userData.permissions || []);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  const hasPermission = (permission: string): boolean => {
    // Admin always has all permissions
    if (user?.role === 'Admin') {
      return true;
    }
    return userPermissions.includes(permission);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    // Admin always has all permissions
    if (user?.role === 'Admin') {
      return true;
    }
    return permissions.some(permission => userPermissions.includes(permission));
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    // Admin always has all permissions
    if (user?.role === 'Admin') {
      return true;
    }
    return permissions.every(permission => userPermissions.includes(permission));
  };

  return {
    user,
    userPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin: user?.role === 'Admin',
  };
};

