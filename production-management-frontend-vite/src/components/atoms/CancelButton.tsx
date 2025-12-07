import React from 'react';
import { XCircle } from 'lucide-react';
import ProtectedButton from '../ProtectedButton';
import './Button.css';

export interface CancelButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /**
   * Permission required to show/cancel the button
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
   * Button variant/size class (default: 'btn btn-sm btn-danger')
   */
  variant?: 'primary' | 'warning' | 'secondary' | 'danger';
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
 * Reusable Cancel Button component following atomic design principles
 * Uses XCircle icon from lucide-react for consistent UI
 */
const CancelButton: React.FC<CancelButtonProps> = ({
  requiredPermission,
  requireAnyOf,
  requireAllOf,
  iconSize = 16,
  variant = 'danger',
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
    danger: 'btn-danger',
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
        <XCircle size={iconSize} />
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
      <XCircle size={iconSize} />
    </button>
  );
};

export default CancelButton;
