import React from 'react';
import { Check } from 'lucide-react';
import './Checkbox.css';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'children'> {
  /**
   * Label text for the checkbox (can also use children)
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
  /**
   * Children to render as label (alternative to label prop)
   */
  children?: React.ReactNode;
}

/**
 * Reusable Checkbox component following atomic design principles
 * Provides a custom-styled checkbox with consistent appearance
 */
const Checkbox = ({
  label,
  labelUppercase = false,
  wrapperClassName = '',
  labelClassName = '',
  className = '',
  id,
  checked,
  disabled,
  children,
  ...restProps
}: CheckboxProps) => {
  const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;
  
  // Explicitly exclude children and dangerouslySetInnerHTML from restProps before passing to input
  const { children: _, dangerouslySetInnerHTML, ...inputProps } = restProps as any;
  
  const labelText = label || children;

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
        {...inputProps}
      />
      <div className="checkbox-container">
        {checked && (
          <div className="checkbox-checkmark">
            <Check size={14} strokeWidth={3} />
          </div>
        )}
      </div>
      {labelText && (
        <span className={`checkbox-label-text ${labelUppercase ? 'checkbox-label-uppercase' : ''} ${labelClassName}`.trim()}>
          {labelText}
        </span>
      )}
    </label>
  );
};

export default Checkbox;
