import React from 'react';
import { Eye } from 'lucide-react';
import ProtectedButton from '../ProtectedButton';

export interface ViewButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /**
   * Permission required to show/view the button
   * If not provided, button will always be visible
   */
  requiredPermission?: string;
  /**
   * Array of permissions - user needs at least one
   */
  requireAnyOf?: string[];
  /**
   * Array of permissions - user needs all of them
   */
  requireAllOf?: string[];
  /**
   * Icon size (default: 16)
   */
  iconSize?: number;
  /**
   * Button variant/size class (default: 'btn btn-sm btn-info')
   */
  variant?: 'primary' | 'warning' | 'secondary' | 'info';
  /**
   * Button size class (default: 'btn-sm')
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Tooltip text
   */
  title?: string;
  /**
   * Click handler
   */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Reusable View Button component following atomic design principles
 * Uses Eye icon from lucide-react for consistent UI
 */
const ViewButton: React.FC<ViewButtonProps> = ({
  requiredPermission,
  requireAnyOf,
  requireAllOf,
  iconSize = 16,
  variant = 'info',
  size = 'sm',
  title,
  onClick,
  className = '',
  disabled,
  ...restProps
}) => {
  // Build button classes
  const variantClasses = {
    primary: 'btn-primary',
    warning: 'btn-warning',
    secondary: 'btn-secondary',
    info: 'btn-info',
  };

  const sizeClasses = {
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'btn-lg',
  };

  const buttonClasses = `btn ${sizeClasses[size]} ${variantClasses[variant]} ${className}`.trim();

  // If permission is required, use ProtectedButton
  if (requiredPermission || requireAnyOf || requireAllOf) {
    return (
      <ProtectedButton
        requiredPermission={requiredPermission}
        requireAnyOf={requireAnyOf}
        requireAllOf={requireAllOf}
        className={buttonClasses}
        title={title}
        onClick={onClick}
        disabled={disabled}
        {...restProps}
      >
        <Eye size={iconSize} />
      </ProtectedButton>
    );
  }

  // Otherwise, use regular button
  return (
    <button
      className={buttonClasses}
      title={title}
      onClick={onClick}
      disabled={disabled}
      {...restProps}
    >
      <Eye size={iconSize} />
    </button>
  );
};

export default ViewButton;
