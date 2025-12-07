import React from 'react';
import './StatisticsContainer.css';

export interface StatisticsContainerProps {
  /**
   * Child stat cards
   */
  children: React.ReactNode;
  /**
   * Minimum width for each card in the grid (default: '200px')
   */
  minCardWidth?: string;
  /**
   * Gap between cards (default: '20px')
   */
  gap?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Reusable StatisticsContainer component following atomic design principles
 * Provides a responsive grid layout for stat cards
 */
const StatisticsContainer: React.FC<StatisticsContainerProps> = ({
  children,
  minCardWidth = '200px',
  gap = '20px',
  className = ''
}) => {
  return (
    <div 
      className={`statistics-container ${className}`.trim()}
      style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(${minCardWidth}, 1fr))`,
        gap
      }}
    >
      {children}
    </div>
  );
};

export default StatisticsContainer;
