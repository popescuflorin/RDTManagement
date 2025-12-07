import React from 'react';
import './View.css';

export interface ViewContentProps {
  /**
   * View content (ViewSection components)
   */
  children: React.ReactNode;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Reusable ViewContent component following atomic design principles
 * Wrapper for view modal content with consistent spacing
 */
const ViewContent: React.FC<ViewContentProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`view-content ${className}`.trim()}>
      {children}
    </div>
  );
};

export default ViewContent;
