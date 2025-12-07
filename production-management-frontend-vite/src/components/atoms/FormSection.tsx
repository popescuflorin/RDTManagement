import React from 'react';
import './Form.css';

export interface FormSectionProps {
  /**
   * Form section content (form rows, etc.)
   */
  children: React.ReactNode;
  /**
   * Section title
   */
  title?: string;
  /**
   * Icon component for the section title
   */
  titleIcon?: React.ComponentType<{ size?: number; className?: string }>;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Reusable FormSection component following atomic design principles
 * Groups related form fields together with optional title
 */
const FormSection: React.FC<FormSectionProps> = ({
  children,
  title,
  titleIcon: TitleIcon,
  className = ''
}) => {
  return (
    <div className={`form-section ${className}`.trim()}>
      {title && (
        <div className="form-section-header">
          {TitleIcon && <TitleIcon size={20} className="form-section-icon" />}
          <h3 className="form-section-title">{title}</h3>
        </div>
      )}
      <div className="form-section-content">
        {children}
      </div>
    </div>
  );
};

export default FormSection;
