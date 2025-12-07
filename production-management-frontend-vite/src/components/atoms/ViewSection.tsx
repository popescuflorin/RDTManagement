import React from 'react';
import './View.css';

export interface ViewSectionProps {
  /**
   * Section title
   */
  title?: string;
  /**
   * Icon component for the section title
   */
  titleIcon?: React.ComponentType<{ size?: number; className?: string }>;
  /**
   * Section content (ViewGrid, ViewItem, etc.)
   */
  children: React.ReactNode;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Reusable ViewSection component following atomic design principles
 * Groups related view items together with optional title
 */
const ViewSection: React.FC<ViewSectionProps> = ({
  title,
  titleIcon: TitleIcon,
  children,
  className = ''
}) => {
  return (
    <div className={`view-section ${className}`.trim()}>
      {title && (
        <div className="view-section-header">
          {TitleIcon && <TitleIcon size={20} className="view-section-icon" />}
          <h3 className="view-section-title">{title}</h3>
        </div>
      )}
      <div className="view-section-content">
        {children}
      </div>
    </div>
  );
};

export default ViewSection;
