import React from 'react';
import './PageContainer.css';

export interface PageContainerProps {
  /**
   * Page content
   */
  children: React.ReactNode;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Reusable Page Container component following atomic design principles
 * Provides consistent page wrapper styling across all pages
 */
const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`page-container ${className}`.trim()}>
      {children}
    </div>
  );
};

export default PageContainer;
