import React from 'react';
import type { LucideIcon } from 'lucide-react';
import './StatCard.css';

export interface StatCardProps {
  /**
   * Icon component from lucide-react
   */
  icon: LucideIcon;
  /**
   * Icon size (default: 24)
   */
  iconSize?: number;
  /**
   * The numeric value to display
   */
  value: string | number | React.ReactNode;
  /**
   * Label text for the stat
   */
  label: string;
  /**
   * Optional description text
   */
  description?: string;
  /**
   * Variant style: 'default', 'primary', 'warning', 'error'
   */
  variant?: 'default' | 'primary' | 'warning' | 'error';
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Reusable StatCard component following atomic design principles
 * Displays a statistic with icon, value, label, and optional description
 */
const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  iconSize = 24,
  value,
  label,
  description,
  variant = 'default',
  className = ''
}) => {
  return (
    <div className={`stat-card stat-card-${variant} ${className}`.trim()}>
      <div className="stat-icon">
        <Icon size={iconSize} />
      </div>
      <div className="stat-content">
        <div className="stat-number">{value}</div>
        <div className="stat-label">{label}</div>
        {description && (
          <div className="stat-description">{description}</div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
