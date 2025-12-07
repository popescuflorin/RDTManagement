import React from 'react';
import { Check } from 'lucide-react';
import './Checkbox.css';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /**
   * Label text for the checkbox
   */
  label?: string;
  /**
   * Whether the label should be uppercase
   */
  labelUppercase?: boolean;
  /**
   * Additional CSS classes for the wrapper
   */
  wrapperClassName?: string;
  /**
   * Additional CSS classes for the label
   */
  labelClassName?: string;
}

/**
 * Reusable Checkbox component following atomic design principles
 * Provides a custom-styled checkbox with consistent appearance
 */
const Checkbox: React.FC<CheckboxProps> = ({
  label,
  labelUppercase = false,
  wrapperClassName = '',
  labelClassName = '',
  className = '',
  id,
  checked,
  disabled,
  ...restProps
}) => {
  const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <label 
      className={`checkbox-wrapper ${disabled ? 'disabled' : ''} ${wrapperClassName}`.trim()}
      htmlFor={checkboxId}
    >
      <input
        type="checkbox"
        id={checkboxId}
        className={`checkbox-input ${className}`.trim()}
        checked={checked}
        disabled={disabled}
        {...restProps}
      />
      <div className="checkbox-container">
        {checked && (
          <div className="checkbox-checkmark">
            <Check size={14} strokeWidth={3} />
          </div>
        )}
      </div>
      {label && (
        <span className={`checkbox-label-text ${labelUppercase ? 'checkbox-label-uppercase' : ''} ${labelClassName}`.trim()}>
          {label}
        </span>
      )}
    </label>
  );
};

export default Checkbox;
