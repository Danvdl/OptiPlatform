import { useEffect, CSSProperties } from 'react';
import './Snackbar.css';

interface Props {
  message: string;
  onClose: () => void;
  type?: 'error' | 'success' | 'warning' | 'info';
  code?: string;
  style?: CSSProperties;
  autoClose?: boolean;
  duration?: number;
}

export default function Snackbar({ 
  message, 
  onClose, 
  type = 'error',
  code,
  style,
  autoClose = true,
  duration = 3000
}: Props) {
  useEffect(() => {
    if (autoClose) {
      const id = setTimeout(onClose, duration);
      return () => clearTimeout(id);
    }
  }, [message, autoClose, duration, onClose]);

  const getTypeIcon = () => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      case 'error':
      default: return '❌';
    }
  };

  const getTypeClass = () => {
    switch (type) {
      case 'success': return 'snackbar-success';
      case 'warning': return 'snackbar-warning';
      case 'info': return 'snackbar-info';
      case 'error':
      default: return 'snackbar-error';
    }
  };

  return (
    <div 
      className={`snackbar ${getTypeClass()}`} 
      style={style}
      onClick={onClose}
    >
      <div className="snackbar-content">
        <span className="snackbar-icon">{getTypeIcon()}</span>
        <div className="snackbar-text">
          <div className="snackbar-message">{message}</div>
          {code && <div className="snackbar-code">Code: {code}</div>}
        </div>
        <button className="snackbar-close" onClick={onClose}>×</button>
      </div>
    </div>
  );
}
