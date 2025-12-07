import React, { useState, useEffect, useRef } from 'react';
import SearchInput from './SearchInput';
import type { SearchInputProps } from './SearchInput';
import './FiltersControl.css';

export interface FiltersControlProps {
  /**
   * Search input placeholder
   */
  searchPlaceholder?: string;
  /**
   * Search input value
   */
  searchValue: string;
  /**
   * Search input onChange handler
   */
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /**
   * Additional search input props
   */
  searchProps?: Omit<SearchInputProps, 'placeholder' | 'value' | 'onChange'>;
  /**
   * Additional filter controls (e.g., checkboxes, selects, buttons)
   */
  filters?: React.ReactNode;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Debounce delay in milliseconds (default: 300ms)
   * Set to 0 to disable debouncing
   */
  debounceMs?: number;
}

/**
 * Reusable FiltersControl component following atomic design principles
 * Provides consistent filter controls layout with search and optional additional filters
 * Includes built-in debouncing for search input to improve performance
 */
const FiltersControl: React.FC<FiltersControlProps> = ({
  searchPlaceholder,
  searchValue,
  onSearchChange,
  searchProps,
  filters,
  className = '',
  debounceMs = 300
}) => {
  // Local state for immediate input updates (better UX)
  const [localValue, setLocalValue] = useState(searchValue);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local value when searchValue prop changes (e.g., from external reset)
  useEffect(() => {
    setLocalValue(searchValue);
  }, [searchValue]);

  // Handle input change with debouncing
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Update local state immediately for responsive UI
    setLocalValue(newValue);

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // If debouncing is disabled (debounceMs === 0), call immediately
    if (debounceMs === 0) {
      onSearchChange(e);
      return;
    }

    // Create a synthetic event with the new value for the debounced call
    const syntheticEvent = {
      ...e,
      target: {
        ...e.target,
        value: newValue
      }
    } as React.ChangeEvent<HTMLInputElement>;

    // Set up debounce timer
    debounceTimerRef.current = setTimeout(() => {
      onSearchChange(syntheticEvent);
    }, debounceMs);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className={`filters-control ${className}`.trim()}>
      <SearchInput
        placeholder={searchPlaceholder}
        value={localValue}
        onChange={handleChange}
        {...searchProps}
      />
      {filters && (
        <div className="filters-control-extra">
          {filters}
        </div>
      )}
    </div>
  );
};

export default FiltersControl;
