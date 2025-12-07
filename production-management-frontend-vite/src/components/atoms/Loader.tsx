import React from 'react';
import { Loader2 } from 'lucide-react';
import './Loader.css';

export interface LoaderProps {
  /**
   * Loading message to display
   */
  message?: string;
  /**
   * Size of the loader icon (default: 32)
   */
  size?: number;
  /**
   * Custom height for the loader container (default: 400px)
   */
  height?: number | string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Reusable Loader component following atomic design principles
 * Provides consistent loading state styling across all pages
 */
const Loader: React.FC<LoaderProps> = ({
  message,
  size = 32,
  height = 400,
  className = ''
}) => {
  return (
    <div 
      className={`loader ${className}`.trim()}
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
    >
      <Loader2 size={size} className="loader-icon" />
      {message && <p className="loader-message">{message}</p>}
    </div>
  );
};

export default Loader;
