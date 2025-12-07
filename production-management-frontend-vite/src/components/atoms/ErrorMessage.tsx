import React from 'react';
import { X } from 'lucide-react';
import './ErrorMessage.css';

export interface ErrorMessageProps {
  /**
   * Error message text to display
   */
  message: string;
  /**
   * Callback when the error is dismissed (if provided, shows close button)
   */
  onDismiss?: () => void;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Reusable ErrorMessage component following atomic design principles
 * Provides consistent error message styling with optional dismiss functionality
 */
const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onDismiss,
  className = ''
}) => {
  if (!message) {
    return null;
  }

  return (
    <div className={`error-message ${className}`.trim()}>
      <span className="error-message-text">{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="error-message-close"
          aria-label="Dismiss error"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
