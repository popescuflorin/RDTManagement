import React from 'react';
import './View.css';

export interface ViewGridProps {
  /**
   * Grid content (ViewItem components)
   */
  children: React.ReactNode;
  /**
   * Number of columns (default: 2)
   */
  columns?: number;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Reusable ViewGrid component following atomic design principles
 * Creates a grid layout for view items
 */
const ViewGrid: React.FC<ViewGridProps> = ({
  children,
  columns = 2,
  className = ''
}) => {
  return (
    <div
      className={`view-grid ${className}`.trim()}
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {children}
    </div>
  );
};

export default ViewGrid;
