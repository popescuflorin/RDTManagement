import React from 'react';
import './View.css';

export interface ViewValueProps {
  /**
   * Value content
   */
  children: React.ReactNode;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Reusable ViewValue component following atomic design principles
 * Provides consistent value styling
 */
const ViewValue: React.FC<ViewValueProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`view-value ${className}`.trim()}>
      {children}
    </div>
  );
};

export default ViewValue;
