import React from 'react';
import './Summary.css';

export interface SummaryItem {
  /**
   * Label text (will be displayed in bold)
   */
  label: string;
  /**
   * Value text
   */
  value: string | number | React.ReactNode;
}

export interface SummaryProps {
  /**
   * Array of summary items to display
   */
  items: SummaryItem[];
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Reusable Summary component following atomic design principles
 * Provides consistent summary display styling across all pages
 */
const Summary: React.FC<SummaryProps> = ({
  items,
  className = ''
}) => {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className={`summary ${className}`.trim()}>
      {items.map((item, index) => (
        <div key={index} className="summary-item">
          <strong>{item.label}</strong> {item.value}
        </div>
      ))}
    </div>
  );
};

export default Summary;
