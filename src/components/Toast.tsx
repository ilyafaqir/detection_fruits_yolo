import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  type: ToastType;
  message: string;
  duration?: number;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ type, message, duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Attendre la fin de l'animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
    error: <XCircle className="h-5 w-5 text-red-500" />,
    warning: <AlertCircle className="h-5 w-5 text-yellow-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
  };

  const backgrounds = {
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  };

  return (
    <div
      className={`
        fixed bottom-4 right-4 flex items-center p-4 rounded-lg border
        transform transition-all duration-300 ease-in-out
        ${backgrounds[type]}
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
      role="alert"
    >
      <div className="flex items-center">
        <div className="flex-shrink-0">{icons[type]}</div>
        <div className="ml-3 text-sm font-medium text-gray-800 dark:text-gray-200">
          {message}
        </div>
        <button
          type="button"
          className="ml-4 inline-flex flex-shrink-0 justify-center items-center h-5 w-5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast; 