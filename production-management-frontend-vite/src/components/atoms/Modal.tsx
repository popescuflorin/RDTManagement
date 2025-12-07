import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import './Modal.css';

export interface ModalProps {
  /**
   * Whether the modal is open
   */
  isOpen: boolean;
  /**
   * Function to call when modal should close
   */
  onClose: () => void;
  /**
   * Modal title text
   */
  title: string;
  /**
   * Icon component for the title (from lucide-react)
   */
  titleIcon?: React.ComponentType<{ size?: number; className?: string }>;
  /**
   * Optional subtitle/section title
   */
  subtitle?: string;
  /**
   * Icon component for the subtitle (from lucide-react)
   */
  subtitleIcon?: React.ComponentType<{ size?: number; className?: string }>;
  /**
   * Modal content (form, text, etc.)
   */
  children: React.ReactNode;
  /**
   * Submit button text (default: "Save" or "Submit")
   */
  submitText?: string;
  /**
   * Cancel button text (default: "Cancel")
   */
  cancelText?: string;
  /**
   * Submit button variant (default: "primary")
   */
  submitVariant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'secondary';
  /**
   * Whether submit button is loading/disabled
   */
  isSubmitting?: boolean;
  /**
   * Submit button click handler
   */
  onSubmit?: () => void;
  /**
   * Whether to show cancel button (default: true)
   */
  showCancel?: boolean;
  /**
   * Whether to close on backdrop click (default: false)
   */
  closeOnBackdropClick?: boolean;
  /**
   * Maximum width of the modal (default: "900px")
   */
  maxWidth?: string;
  /**
   * Additional CSS classes for modal content
   */
  className?: string;
  /**
   * Custom footer content (overrides default submit/cancel buttons)
   */
  footer?: React.ReactNode;
}

/**
 * Reusable Modal component following atomic design principles
 * Provides a standardized modal structure with:
 * - Title with icon
 * - Close button (X)
 * - Optional subtitle with icon
 * - Content area
 * - Submit and Cancel buttons
 */
const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  titleIcon: TitleIcon,
  subtitle,
  subtitleIcon: SubtitleIcon,
  children,
  submitText = 'Save',
  cancelText = 'Cancel',
  submitVariant = 'primary',
  isSubmitting = false,
  onSubmit,
  showCancel = true,
  closeOnBackdropClick = false,
  maxWidth = '900px',
  className = '',
  footer
}) => {
  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSubmit = () => {
    if (onSubmit && !isSubmitting) {
      onSubmit();
    }
  };

  return (
    <div 
      className="modal-backdrop" 
      onClick={handleBackdropClick}
    >
      <div 
        className={`modal-content ${className}`}
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-header-content">
            {TitleIcon && (
              <TitleIcon size={24} className="modal-title-icon" />
            )}
            <h2 className="modal-title">{title}</h2>
          </div>
          <button 
            className="modal-close-button" 
            onClick={onClose}
            aria-label="Close modal"
            type="button"
          >
            <X size={24} />
          </button>
        </div>

        {/* Subtitle Section */}
        {subtitle && (
          <div className="modal-subtitle">
            {SubtitleIcon && (
              <SubtitleIcon size={20} className="modal-subtitle-icon" />
            )}
            <h3 className="modal-subtitle-text">{subtitle}</h3>
          </div>
        )}

        {/* Modal Content */}
        <div className="modal-body">
          {children}
        </div>

        {/* Modal Footer */}
        {footer ? (
          <div className="modal-footer">
            {footer}
          </div>
        ) : (onSubmit || showCancel) && (
          <div className="modal-footer">
            {showCancel && (
              <button
                type="button"
                className="btn btn-md btn-secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                {cancelText}
              </button>
            )}
            {onSubmit && (
              <button
                type="button"
                className={`btn btn-md btn-${submitVariant}`}
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Loading...' : submitText}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
