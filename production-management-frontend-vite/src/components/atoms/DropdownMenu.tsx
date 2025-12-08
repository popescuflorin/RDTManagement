import React from 'react';
import './DropdownMenu.css';

export interface DropdownMenuItem<T = any> {
  /**
   * Unique identifier for the item
   */
  id: string | number;
  /**
   * Item data (can be any type)
   */
  data: T;
  /**
   * Primary text to display
   */
  label: string;
  /**
   * Optional secondary text/detail to display
   */
  detail?: string;
  /**
   * Optional custom render function for the item
   */
  render?: (item: DropdownMenuItem<T>) => React.ReactNode;
}

export interface DropdownMenuProps<T = any> {
  /**
   * Whether the dropdown is visible
   */
  isOpen: boolean;
  /**
   * Array of items to display
   */
  items: DropdownMenuItem<T>[];
  /**
   * Callback when an item is clicked
   */
  onItemClick: (item: DropdownMenuItem<T>) => void;
  /**
   * Optional empty state message when no items and no search term
   */
  emptyMessage?: string;
  /**
   * Optional search term (for showing "create new" option)
   */
  searchTerm?: string;
  /**
   * Optional "create new" message template (e.g., "Create New: {searchTerm}")
   */
  createNewMessage?: string;
  /**
   * Optional detail message for create new option
   */
  createNewDetail?: string;
  /**
   * Callback when "create new" option is clicked
   */
  onCreateNew?: () => void;
  /**
   * Optional maximum height (default: '200px')
   */
  maxHeight?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Reusable DropdownMenu component following atomic design principles
 * Provides consistent dropdown styling for search/select inputs
 */
const DropdownMenu = <T,>({
  isOpen,
  items,
  onItemClick,
  emptyMessage,
  searchTerm,
  createNewMessage,
  createNewDetail,
  onCreateNew,
  maxHeight = '200px',
  className = ''
}: DropdownMenuProps<T>) => {
  if (!isOpen) return null;

  const hasItems = items.length > 0;
  const hasSearchTerm = searchTerm && searchTerm.trim().length > 0;

  return (
    <div 
      className={`dropdown-menu ${className}`.trim()}
      style={{ maxHeight }}
    >
      {hasItems ? (
        items.map((item) => {
          if (item.render) {
            return (
              <div
                key={item.id}
                className="dropdown-item"
                onClick={() => onItemClick(item)}
              >
                {item.render(item)}
              </div>
            );
          }

          return (
            <div
              key={item.id}
              className="dropdown-item"
              onClick={() => onItemClick(item)}
            >
              <div className="dropdown-item-name">{item.label}</div>
              {item.detail && (
                <div className="dropdown-item-detail">{item.detail}</div>
              )}
            </div>
          );
        })
      ) : hasSearchTerm && onCreateNew ? (
        <div
          className="dropdown-item dropdown-item-create"
          onClick={onCreateNew}
        >
          <div className="dropdown-item-name">
            {createNewMessage ? createNewMessage.replace('{searchTerm}', searchTerm) : `Create New: ${searchTerm}`}
          </div>
          {createNewDetail && (
            <div className="dropdown-item-detail">{createNewDetail}</div>
          )}
        </div>
      ) : (
        <div className="dropdown-item dropdown-item-empty">
          <div className="dropdown-item-name">
            {emptyMessage || 'Start typing...'}
          </div>
        </div>
      )}
    </div>
  );
};

export default DropdownMenu;
