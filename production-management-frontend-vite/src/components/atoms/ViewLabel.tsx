import React from 'react';
import './View.css';

export interface ViewLabelProps {
  /**
   * Label text
   */
  children: React.ReactNode;
  /**
   * Icon component for the label (from lucide-react)
   */
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  /**
   * Icon size (default: 14)
   */
  iconSize?: number;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Reusable ViewLabel component following atomic design principles
 * Provides consistent label styling with optional icon
 */
const ViewLabel: React.FC<ViewLabelProps> = ({
  children,
  icon: Icon,
  iconSize = 14,
  className = ''
}) => {
  return (
    <label className={`view-label ${className}`.trim()}>
      {Icon && <Icon size={iconSize} className="view-label-icon" />}
      {children}
    </label>
  );
};

export default ViewLabel;
