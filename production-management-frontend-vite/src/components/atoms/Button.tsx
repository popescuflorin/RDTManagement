import React from 'react';
import ProtectedButton from '../ProtectedButton';
import './Button.css';

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /**
   * Button content (text)
   */
  children: React.ReactNode;
  /**
   * Permission required to show/use the button
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
   * Button variant (default: 'primary')
   */
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  /**
   * Button size (default: 'md')
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Reusable Button component following atomic design principles
 * General-purpose button without icon, text-only
 */
const Button: React.FC<ButtonProps> = ({
  children,
  requiredPermission,
  requireAnyOf,
  requireAllOf,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  ...restProps
}) => {
  // Build button classes
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    success: 'btn-success',
    warning: 'btn-warning',
    danger: 'btn-danger',
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
        disabled={disabled}
        {...restProps}
      >
        {children}
      </ProtectedButton>
    );
  }

  // Otherwise, use regular button
  return (
    <button
      className={buttonClasses}
      disabled={disabled}
      {...restProps}
    >
      {children}
    </button>
  );
};

export default Button;
