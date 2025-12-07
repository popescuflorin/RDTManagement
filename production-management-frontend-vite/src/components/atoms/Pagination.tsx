import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './Pagination.css';

export interface PaginationData {
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface PaginationLabels {
  showing?: string | ((data: { start: number; end: number; total: number }) => string);
  first?: string;
  previous?: string;
  next?: string;
  last?: string;
  show?: string;
  perPage?: string;
}

export interface PaginationProps {
  /**
   * Pagination data
   */
  data: PaginationData;
  /**
   * Current page number (for controlled component)
   */
  currentPage: number;
  /**
   * Current page size (for controlled component)
   */
  pageSize: number;
  /**
   * Callback when page changes
   */
  onPageChange: (page: number) => void;
  /**
   * Callback when page size changes
   */
  onPageSizeChange: (pageSize: number) => void;
  /**
   * Translation labels (can be strings or functions)
   */
  labels?: PaginationLabels;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Reusable Pagination component following atomic design principles
 * Provides consistent pagination controls with page navigation and size selector
 */
const Pagination: React.FC<PaginationProps> = ({
  data,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  labels = {},
  className = ''
}) => {
  const {
    totalPages,
    totalCount,
    hasPreviousPage,
    hasNextPage
  } = data;

  // Calculate pagination info
  const start = ((data.page - 1) * data.pageSize) + 1;
  const end = Math.min(data.page * data.pageSize, totalCount);

  // Get labels with defaults
  const showingLabel = typeof labels.showing === 'function' 
    ? labels.showing({ start, end, total: totalCount })
    : labels.showing || `Showing ${start}-${end} of ${totalCount}`;
  
  const firstLabel = labels.first || 'First';
  const previousLabel = labels.previous || 'Previous';
  const nextLabel = labels.next || 'Next';
  const lastLabel = labels.last || 'Last';
  const showLabel = labels.show || 'Show';
  const perPageLabel = labels.perPage || 'per page';

  // Calculate page numbers to display (max 5 pages)
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxPages = 5;

    if (totalPages <= maxPages) {
      // Show all pages if total is 5 or less
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else if (currentPage <= 3) {
      // Show first 5 pages
      for (let i = 1; i <= maxPages; i++) {
        pages.push(i);
      }
    } else if (currentPage >= totalPages - 2) {
      // Show last 5 pages
      for (let i = totalPages - 4; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show 2 pages before and 2 pages after current
      for (let i = currentPage - 2; i <= currentPage + 2; i++) {
        pages.push(i);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  if (totalPages === 0) {
    return null;
  }

  return (
    <div className={`pagination-container ${className}`.trim()}>
      <div className="pagination-info">
        {showingLabel}
      </div>
      
      <div className="pagination-controls">
        <button
          className="pagination-btn"
          onClick={() => onPageChange(1)}
          disabled={!hasPreviousPage}
        >
          {firstLabel}
        </button>
        <button
          className="pagination-btn"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPreviousPage}
        >
          <ChevronLeft size={16} />
          {previousLabel}
        </button>
        
        <div className="pagination-pages">
          {pageNumbers.map((pageNum) => (
            <button
              key={pageNum}
              className={`pagination-page ${currentPage === pageNum ? 'active' : ''}`}
              onClick={() => onPageChange(pageNum)}
            >
              {pageNum}
            </button>
          ))}
        </div>
        
        <button
          className="pagination-btn"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNextPage}
        >
          {nextLabel}
          <ChevronRight size={16} />
        </button>
        <button
          className="pagination-btn"
          onClick={() => onPageChange(totalPages)}
          disabled={!hasNextPage}
        >
          {lastLabel}
        </button>
      </div>
      
      <div className="page-size-selector">
        <label>{showLabel}</label>
        <select
          value={pageSize}
          onChange={(e) => {
            onPageSizeChange(Number(e.target.value));
            onPageChange(1); // Reset to first page when size changes
          }}
          className="page-size-select"
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
        <span>{perPageLabel}</span>
      </div>
    </div>
  );
};

export default Pagination;
