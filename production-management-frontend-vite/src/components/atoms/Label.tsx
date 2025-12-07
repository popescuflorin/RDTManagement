import React from 'react';
import './Form.css';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /**
   * Label text
   */
  children: React.ReactNode;
  /**
   * Whether the field is required (adds asterisk)
   */
  required?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Reusable Label component following atomic design principles
 * Provides consistent label styling with optional required indicator
 */
const Label: React.FC<LabelProps> = ({
  children,
  required = false,
  className = '',
  ...restProps
}) => {
  return (
    <label
      className={`form-label ${required ? 'form-label-required' : ''} ${className}`.trim()}
      {...restProps}
    >
      {children}
      {required && <span className="form-required-indicator"> *</span>}
    </label>
  );
};

export default Label;
