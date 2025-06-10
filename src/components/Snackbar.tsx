import { useEffect } from 'react';
import './Snackbar.css';

interface Props {
  message: string;
  onClose: () => void;
}

export default function Snackbar({ message, onClose }: Props) {
  useEffect(() => {
    const id = setTimeout(onClose, 3000);
    return () => clearTimeout(id);
  }, [message]);

  return <div className="snackbar">{message}</div>;
}
