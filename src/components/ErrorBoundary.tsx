import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logError } from '../utils/frontendLogger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * Error Boundary Component
 * 
 * Catches React component errors and displays a fallback UI.
 * Logs errors to the frontend logger for tracking.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to our tracking system
    logError(error, {
      componentStack: errorInfo.componentStack,
      type: 'React Error Boundary',
    });

    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          maxWidth: '600px',
          margin: '4rem auto',
        }}>
          <div style={{
            fontSize: '4rem',
            marginBottom: '1rem',
          }}>
            😞
          </div>
          <h1 style={{
            fontSize: '1.5rem',
            marginBottom: '0.5rem',
            color: '#dc2626',
          }}>
            Oops! Something went wrong
          </h1>
          <p style={{
            color: '#6b7280',
            marginBottom: '1.5rem',
          }}>
            We're sorry for the inconvenience. The error has been logged and we'll look into it.
          </p>
          
          {import.meta.env.DEV && this.state.error && (
            <details style={{
              marginTop: '2rem',
              padding: '1rem',
              background: '#f3f4f6',
              borderRadius: '0.5rem',
              textAlign: 'left',
            }}>
              <summary style={{
                cursor: 'pointer',
                fontWeight: 'bold',
                marginBottom: '0.5rem',
              }}>
                Error Details (Development Only)
              </summary>
              <pre style={{
                fontSize: '0.875rem',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
              }}>
                {this.state.error.toString()}
                {'\n\n'}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}

          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1.5rem',
              padding: '0.75rem 1.5rem',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500',
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
