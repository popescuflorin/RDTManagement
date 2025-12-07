import React from 'react';
import './Form.css';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /**
   * Select size variant (default: 'md')
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Whether select has error state
   */
  error?: boolean;
  /**
   * Error message to display
   */
  errorMessage?: string;
  /**
   * Options for the select element
   * Can be either an array of SelectOption objects or React option elements
   */
  options?: SelectOption[];
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Reusable Select component following atomic design principles
 * Provides consistent select styling with error states
 */
const Select: React.FC<SelectProps> = ({
  size = 'md',
  error = false,
  errorMessage,
  options,
  className = '',
  children,
  ...restProps
}) => {
  return (
    <div className="form-input-wrapper">
      <select
        className={`form-select form-select-${size} ${error ? 'form-input-error' : ''} ${className}`.trim()}
        {...restProps}
      >
        {options
          ? options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))
          : children}
      </select>
      {error && errorMessage && (
        <span className="form-error-message">{errorMessage}</span>
      )}
    </div>
  );
};

export default Select;
