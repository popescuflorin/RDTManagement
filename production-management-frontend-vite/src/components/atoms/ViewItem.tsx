import React from 'react';
import './View.css';

export interface ViewItemProps {
  /**
   * View item content (ViewLabel and ViewValue)
   */
  children: React.ReactNode;
  /**
   * Whether this item spans full width
   */
  fullWidth?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Reusable ViewItem component following atomic design principles
 * Wraps a label and value pair for display
 */
const ViewItem: React.FC<ViewItemProps> = ({
  children,
  fullWidth = false,
  className = ''
}) => {
  return (
    <div className={`view-item ${fullWidth ? 'view-item-full-width' : ''} ${className}`.trim()}>
      {children}
    </div>
  );
};

export default ViewItem;
