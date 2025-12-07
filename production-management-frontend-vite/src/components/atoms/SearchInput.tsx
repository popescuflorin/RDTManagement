import React from 'react';
import { Search } from 'lucide-react';
import './SearchInput.css';

export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /**
   * Placeholder text for the search input
   */
  placeholder?: string;
  /**
   * Current value of the search input
   */
  value: string;
  /**
   * Callback when the search value changes
   */
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /**
   * Size of the search icon (default: 20)
   */
  iconSize?: number;
  /**
   * Maximum width of the search container (default: '500px')
   */
  maxWidth?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Reusable SearchInput component following atomic design principles
 * Provides consistent search input styling with icon across all pages
 */
const SearchInput: React.FC<SearchInputProps> = ({
  placeholder,
  value,
  onChange,
  iconSize = 20,
  maxWidth = '500px',
  className = '',
  ...restProps
}) => {
  return (
    <div 
      className={`search-container ${className}`.trim()}
      style={{ maxWidth }}
    >
      <div className="search-input-wrapper">
        <Search size={iconSize} className="search-icon" />
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="search-input"
          {...restProps}
        />
      </div>
    </div>
  );
};

export default SearchInput;
