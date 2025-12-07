import React from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import './Table.css';

export interface TableColumn<T = any> {
  /** Unique key for the column */
  key: string;
  /** Column header label */
  label: string;
  /** Whether the column is sortable */
  sortable?: boolean;
  /** Custom render function for cell content */
  render?: (value: any, row: T, index: number) => React.ReactNode;
  /** Column alignment */
  align?: 'left' | 'center' | 'right';
  /** Column width (CSS value) */
  width?: string;
  /** CSS class name for the column header */
  headerClassName?: string;
  /** CSS class name for the column cells */
  cellClassName?: string;
}

export interface TableProps<T = any> {
  /** Array of column definitions */
  columns: TableColumn<T>[];
  /** Array of data rows */
  data: T[];
  /** Current sort column key */
  sortBy?: string;
  /** Current sort order */
  sortOrder?: 'asc' | 'desc';
  /** Callback when sort changes */
  onSort?: (columnKey: string, order: 'asc' | 'desc') => void;
  /** Empty state message */
  emptyMessage?: string;
  /** CSS class name for the table container */
  className?: string;
  /** CSS class name for the table */
  tableClassName?: string;
  /** Custom row renderer */
  renderRow?: (row: T, index: number) => React.ReactNode;
  /** Row key getter */
  getRowKey?: (row: T, index: number) => string | number;
  /** Row className getter */
  getRowClassName?: (row: T, index: number) => string;
  /** Show table container wrapper */
  showContainer?: boolean;
}

const Table = <T extends Record<string, any> = any>({
  columns,
  data,
  sortBy,
  sortOrder = 'asc',
  onSort,
  emptyMessage = 'No data available',
  className = '',
  tableClassName = '',
  renderRow,
  getRowKey = (row: T, index: number) => (row.id ?? index),
  getRowClassName,
  showContainer = true,
}: TableProps<T>) => {
  const handleSort = (columnKey: string) => {
    if (!onSort) return;
    
    if (sortBy === columnKey) {
      // Toggle sort order if clicking the same column
      onSort(columnKey, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort column with ascending order
      onSort(columnKey, 'asc');
    }
  };

  const getSortIcon = (columnKey: string) => {
    if (sortBy !== columnKey) {
      return <ArrowUpDown size={14} className="sort-icon inactive" />;
    }
    return sortOrder === 'asc' 
      ? <ArrowUp size={14} className="sort-icon active" />
      : <ArrowDown size={14} className="sort-icon active" />;
  };

  const renderCell = (column: TableColumn<T>, row: T, index: number) => {
    const value = row[column.key];
    
    if (column.render) {
      return column.render(value, row, index);
    }
    
    return value ?? '—';
  };

  const tableContent = (
    <table className={`data-table ${tableClassName}`}>
      <thead>
        <tr>
          {columns.map((column) => (
            <th
              key={column.key}
              className={`
                ${column.sortable ? 'sortable' : ''} 
                ${column.headerClassName || ''}
              `.trim()}
              style={{
                textAlign: column.align || 'left',
                width: column.width,
                cursor: column.sortable ? 'pointer' : 'default',
              }}
              onClick={() => column.sortable && handleSort(column.key)}
            >
              <div className="th-content">
                <span>{column.label}</span>
                {column.sortable && getSortIcon(column.key)}
              </div>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr>
            <td colSpan={columns.length} className="no-data">
              {emptyMessage}
            </td>
          </tr>
        ) : (
          data.map((row, index) => {
            const rowKey = getRowKey(row, index);
            const rowClassName = getRowClassName ? getRowClassName(row, index) : '';
            
            if (renderRow) {
              return (
                <tr key={rowKey} className={rowClassName}>
                  {renderRow(row, index)}
                </tr>
              );
            }
            
            return (
              <tr key={rowKey} className={rowClassName}>
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={column.cellClassName || ''}
                    style={{ textAlign: column.align || 'left' }}
                  >
                    {renderCell(column, row, index)}
                  </td>
                ))}
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );

  if (!showContainer) {
    return (
      <div className={`table-wrapper ${className}`.trim()}>
        {tableContent}
      </div>
    );
  }

  return (
    <div className={`table-container ${className}`}>
      {tableContent}
    </div>
  );
};

export default Table;
