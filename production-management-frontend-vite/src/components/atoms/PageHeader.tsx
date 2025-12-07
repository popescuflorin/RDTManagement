import React from 'react';
import type { LucideIcon } from 'lucide-react';
import './PageContainer.css';

export interface PageHeaderProps {
  /**
   * Page title text
   */
  title: string;
  /**
   * Optional icon to display before the title
   */
  icon?: LucideIcon;
  /**
   * Optional content to display on the right side (e.g., action buttons)
   */
  actions?: React.ReactNode;
  /**
   * Optional subtitle or description
   */
  subtitle?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Reusable Page Header component following atomic design principles
 * Provides consistent page header styling with title, icon, and actions
 */
const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  icon: Icon,
  actions,
  subtitle,
  className = ''
}) => {
  return (
    <div className={`page-header ${className}`.trim()}>
      <div className="page-header-content">
        <div className="page-header-title-wrapper">
          {Icon && (
            <Icon 
              size={24} 
              className="page-header-icon"
            />
          )}
          <div>
            <h1 className="page-header-title">{title}</h1>
            {subtitle && (
              <p className="page-header-subtitle">{subtitle}</p>
            )}
          </div>
        </div>
        {actions && (
          <div className="page-header-actions">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
