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
  /**
   * Inline styles
   */
  style?: React.CSSProperties;
}

/**
 * Reusable ViewValue component following atomic design principles
 * Provides consistent value styling
 */
const ViewValue: React.FC<ViewValueProps> = ({
  children,
  className = '',
  style
}) => {
  return (
    <div className={`view-value ${className}`.trim()} style={style}>
      {children}
    </div>
  );
};

export default ViewValue;
