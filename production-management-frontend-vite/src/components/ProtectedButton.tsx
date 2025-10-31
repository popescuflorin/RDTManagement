import React from 'react';
import { usePermissions } from '../hooks/usePermissions';

interface ProtectedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  requiredPermission?: string;
  requireAnyOf?: string[];
  requireAllOf?: string[];
  children: React.ReactNode;
}

const ProtectedButton: React.FC<ProtectedButtonProps> = ({ 
  requiredPermission, 
  requireAnyOf,
  requireAllOf,
  children,
  ...buttonProps 
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  // Check permissions
  let hasAccess = true;

  if (requiredPermission) {
    hasAccess = hasPermission(requiredPermission);
  } else if (requireAnyOf && requireAnyOf.length > 0) {
    hasAccess = hasAnyPermission(requireAnyOf);
  } else if (requireAllOf && requireAllOf.length > 0) {
    hasAccess = hasAllPermissions(requireAllOf);
  }

  // If user doesn't have permission, don't render the button
  if (!hasAccess) {
    return null;
  }

  return <button {...buttonProps}>{children}</button>;
};

export default ProtectedButton;

