import React from 'react';
import './Form.css';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'children'> {
  /**
   * Input type (default: 'text')
   */
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'date' | 'time' | 'datetime-local';
  /**
   * Input size variant (default: 'md')
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Whether input has error state
   */
  error?: boolean;
  /**
   * Error message to display
   */
  errorMessage?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Reusable Input component following atomic design principles
 * Provides consistent input styling with error states
 */
const Input = ({
  type = 'text',
  size = 'md',
  error = false,
  errorMessage,
  className = '',
  onClick,
  onFocus,
  ...restProps
}: InputProps) => {
  // Explicitly exclude children and dangerouslySetInnerHTML from restProps
  const { children, dangerouslySetInnerHTML, ...inputProps } = restProps as any;
  
  // Handle click for number inputs - select all text
  const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
    if (type === 'number') {
      e.currentTarget.select();
    }
    onClick?.(e);
  };

  // Handle focus for number inputs - select all text
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (type === 'number') {
      e.currentTarget.select();
    }
    onFocus?.(e);
  };
  
  return (
    <div className="form-input-wrapper">
      <input
        type={type}
        className={`form-input form-input-${size} ${error ? 'form-input-error' : ''} ${className}`.trim()}
        onClick={handleClick}
        onFocus={handleFocus}
        {...inputProps}
      />
      {error && errorMessage && (
        <span className="form-error-message">{errorMessage}</span>
      )}
    </div>
  );
};

export default Input;
