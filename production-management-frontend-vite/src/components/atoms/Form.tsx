import React from 'react';
import './Form.css';

export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  /**
   * Form content
   */
  children: React.ReactNode;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Form layout variant (default: 'default')
   */
  variant?: 'default' | 'compact' | 'spacious';
}

/**
 * Reusable Form component following atomic design principles
 * Provides consistent form styling and layout
 */
const Form: React.FC<FormProps> = ({
  children,
  className = '',
  variant = 'default',
  ...restProps
}) => {
  return (
    <form
      className={`form form-${variant} ${className}`.trim()}
      {...restProps}
    >
      {children}
    </form>
  );
};

export default Form;
