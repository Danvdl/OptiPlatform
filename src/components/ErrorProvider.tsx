import { createContext, useContext, useState } from 'react';
import Snackbar from './Snackbar';

interface ErrorContextValue {
  showError: (message: string) => void;
}

const ErrorContext = createContext<ErrorContextValue>({ showError: () => {} });

export function ErrorProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState('');
  return (
    <ErrorContext.Provider value={{ showError: (msg) => setMessage(msg) }}>
      {children}
      {message && <Snackbar message={message} onClose={() => setMessage('')} />}
    </ErrorContext.Provider>
  );
}

export const useError = () => useContext(ErrorContext);
