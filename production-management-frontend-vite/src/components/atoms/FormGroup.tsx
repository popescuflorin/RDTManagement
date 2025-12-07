import React from 'react';
import './Form.css';

export interface FormGroupProps {
  /**
   * Form group content (label, input, etc.)
   */
  children: React.ReactNode;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Whether this is a full-width group (default: false)
   */
  fullWidth?: boolean;
}

/**
 * Reusable FormGroup component following atomic design principles
 * Wraps label and input together for consistent spacing
 */
const FormGroup: React.FC<FormGroupProps> = ({
  children,
  className = '',
  fullWidth = false
}) => {
  return (
    <div className={`form-group ${fullWidth ? 'form-group-full-width' : ''} ${className}`.trim()}>
      {children}
    </div>
  );
};

export default FormGroup;
