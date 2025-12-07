import React from 'react';
import './Form.css';

export interface FormRowProps {
  /**
   * Form row content (form groups)
   */
  children: React.ReactNode;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Number of columns (default: 'auto' - distributes evenly)
   */
  columns?: number | 'auto';
}

/**
 * Reusable FormRow component following atomic design principles
 * Creates a row layout for form groups
 */
const FormRow: React.FC<FormRowProps> = ({
  children,
  className = '',
  columns = 'auto'
}) => {
  const style = columns !== 'auto' ? { gridTemplateColumns: `repeat(${columns}, 1fr)` } : undefined;

  return (
    <div
      className={`form-row ${className}`.trim()}
      style={style}
    >
      {children}
    </div>
  );
};

export default FormRow;
