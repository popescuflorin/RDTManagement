import React from 'react';
import { Plus } from 'lucide-react';
import ProtectedButton from '../ProtectedButton';
import './Button.css';

export interface CreateButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /**
   * Permission required to show/create the button
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
   * Button variant/size class (default: 'btn btn-md btn-primary')
   */
  variant?: 'primary' | 'success' | 'secondary' | 'info';
  /**
   * Button size class (default: 'btn-md')
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Button label text (displayed next to the icon)
   */
  children?: React.ReactNode;
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
 * Reusable Create Button component following atomic design principles
 * Uses Plus icon from lucide-react for consistent UI
 * Typically used for "Create", "Add", "New" actions
 */
const CreateButton: React.FC<CreateButtonProps> = ({
  requiredPermission,
  requireAnyOf,
  requireAllOf,
  iconSize = 16,
  variant = 'primary',
  size = 'md',
  children,
  title,
  onClick,
  className = '',
  disabled,
  ...restProps
}) => {
  // Build button classes
  const variantClasses = {
    primary: 'btn-primary',
    success: 'btn-success',
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
        <Plus size={iconSize} />
        {children}
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
      <Plus size={iconSize} />
      {children}
    </button>
  );
};

export default CreateButton;
