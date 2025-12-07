import React from 'react';
import './Form.css';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /**
   * Textarea size variant (default: 'md')
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Whether textarea has error state
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
 * Reusable Textarea component following atomic design principles
 * Provides consistent textarea styling with error states
 */
const Textarea: React.FC<TextareaProps> = ({
  size = 'md',
  error = false,
  errorMessage,
  className = '',
  ...restProps
}) => {
  return (
    <div className="form-input-wrapper">
      <textarea
        className={`form-textarea form-textarea-${size} ${error ? 'form-input-error' : ''} ${className}`.trim()}
        {...restProps}
      />
      {error && errorMessage && (
        <span className="form-error-message">{errorMessage}</span>
      )}
    </div>
  );
};

export default Textarea;
