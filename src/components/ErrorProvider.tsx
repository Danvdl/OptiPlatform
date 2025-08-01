import { createContext, useContext, useState, useCallback } from 'react';
import Snackbar from './Snackbar';

interface ErrorInfo {
  id: string;
  message: string;
  code?: string;
  timestamp: number;
}

interface ErrorContextValue {
  showError: (message: string, code?: string) => void;
  showSuccess: (message: string) => void;
  clearErrors: () => void;
  errors: ErrorInfo[];
}

const ErrorContext = createContext<ErrorContextValue>({ 
  showError: () => {}, 
  showSuccess: () => {},
  clearErrors: () => {},
  errors: []
});

export function ErrorProvider({ children }: { children: React.ReactNode }) {
  const [errors, setErrors] = useState<ErrorInfo[]>([]);
  const [successMessage, setSuccessMessage] = useState('');

  const showError = useCallback((message: string, code?: string) => {
    const error: ErrorInfo = {
      id: Date.now().toString(),
      message,
      code,
      timestamp: Date.now()
    };
    
    setErrors(prev => [...prev, error]);
    
    // Auto-remove error after 5 seconds
    setTimeout(() => {
      setErrors(prev => prev.filter(e => e.id !== error.id));
    }, 5000);
  }, []);

  const showSuccess = useCallback((message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const removeError = useCallback((id: string) => {
    setErrors(prev => prev.filter(e => e.id !== id));
  }, []);

  return (
    <ErrorContext.Provider value={{ showError, showSuccess, clearErrors, errors }}>
      {children}
      
      {/* Error Messages */}
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 10000 }}>
        {errors.map((error) => (
          <Snackbar 
            key={error.id}
            message={error.message} 
            type="error"
            code={error.code}
            onClose={() => removeError(error.id)}
            style={{ marginBottom: '10px' }}
          />
        ))}
      </div>

      {/* Success Message */}
      {successMessage && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 10000 }}>
          <Snackbar 
            message={successMessage} 
            type="success"
            onClose={() => setSuccessMessage('')}
          />
        </div>
      )}
    </ErrorContext.Provider>
  );
}

export const useError = () => useContext(ErrorContext);
