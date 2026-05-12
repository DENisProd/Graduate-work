'use client';

import React, {
  useState,
  useEffect,
  createContext,
  useContext,
  useCallback,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CircleCheck, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'center';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
}

interface ToastEntry {
  toast: Toast;
  position: ToastPosition;
}

interface ToastContextType {
  showToast: (
    message: string,
    type?: ToastType,
    positionOrDuration?: ToastPosition | number,
    duration?: number
  ) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  const showToast = useCallback(
    (
      message: string,
      type: ToastType = 'info',
      positionOrDuration: ToastPosition | number = 'bottom-right',
      duration?: number
    ) => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      const position =
        typeof positionOrDuration === 'string'
          ? positionOrDuration
          : 'bottom-right';
      const resolvedDuration =
        typeof positionOrDuration === 'number'
          ? positionOrDuration
          : duration ?? 5000;

      setToasts((prev) => [
        ...prev,
        { toast: { id, message, type, duration: resolvedDuration }, position },
      ]);

      if (resolvedDuration > 0) {
        window.setTimeout(() => {
          setToasts((prev) => prev.filter((entry) => entry.toast.id !== id));
        }, resolvedDuration);
      }
    },
    []
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {(
        [
          'top-left',
          'top-right',
          'bottom-left',
          'bottom-right',
          'center',
        ] satisfies ToastPosition[]
      ).map((position) => (
        <ToastContainer
          key={position}
          toasts={toasts.filter((entry) => entry.position === position)}
          position={position}
        />
      ))}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastContainerProps {
  toasts: ToastEntry[];
  position: ToastPosition;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, position }) => {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= 640
  );

  useEffect(() => {
    const updateIsMobile = () => {
      setIsMobile(window.innerWidth <= 640);
    };

    window.addEventListener('resize', updateIsMobile);

    return () => {
      window.removeEventListener('resize', updateIsMobile);
    };
  }, []);

  const adjustedPosition =
    isMobile && position !== 'center'
      ? position.startsWith('top')
        ? 'top'
        : 'bottom'
      : position;

  const getPositionClasses = () => {
    switch (adjustedPosition) {
      case 'top-left':
        return 'top-4 left-4 items-start';
      case 'top-right':
        return 'top-4 right-4 items-end';
      case 'bottom-left':
        return 'bottom-4 left-4 items-start';
      case 'bottom-right':
        return 'bottom-4 right-4 items-end';
      case 'top':
        return 'top-4 left-1/2 -translate-x-1/2 items-center';
      case 'bottom':
        return 'bottom-4 left-1/2 -translate-x-1/2 items-center';
      case 'center':
        return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 items-center';
      default:
        return '';
    }
  };

  const getInitialY = () => {
    if (adjustedPosition.startsWith('top')) {
      return -50;
    }

    if (adjustedPosition === 'center') {
      return 0;
    }

    return 50;
  };

  return (
    <div
      className={`pointer-events-none fixed z-[100] flex w-full max-w-full flex-col gap-2 px-4 sm:w-auto sm:max-w-sm sm:px-0 ${getPositionClasses()}`}
    >
      <AnimatePresence>
        {toasts.map(({ toast }) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: getInitialY() }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: getInitialY() }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="pointer-events-auto w-full"
          >
            <ToastComponent {...toast} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

const ToastComponent: React.FC<Toast> = ({ message, type }) => {
  const typeConfig = {
    success: {
      icon: CircleCheck,
      bgColor: 'bg-green-50 dark:bg-green-950/40',
      textColor: 'text-green-800 dark:text-green-200',
      borderColor: 'border-green-200 dark:border-green-900',
    },
    error: {
      icon: AlertCircle,
      bgColor: 'bg-red-50 dark:bg-red-950/40',
      textColor: 'text-red-800 dark:text-red-200',
      borderColor: 'border-red-200 dark:border-red-900',
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-yellow-50 dark:bg-yellow-950/40',
      textColor: 'text-yellow-800 dark:text-yellow-200',
      borderColor: 'border-yellow-200 dark:border-yellow-900',
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50 dark:bg-blue-950/40',
      textColor: 'text-blue-800 dark:text-blue-200',
      borderColor: 'border-blue-200 dark:border-blue-900',
    },
  } satisfies Record<
    ToastType,
    {
      icon: typeof CircleCheck;
      bgColor: string;
      textColor: string;
      borderColor: string;
    }
  >;

  const { icon: Icon, bgColor, textColor, borderColor } = typeConfig[type];

  return (
    <div
      className={`${bgColor} ${borderColor} w-full max-w-full rounded-lg border p-4 shadow-lg backdrop-blur-sm`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <Icon className={`${textColor} h-5 w-5 shrink-0`} />
        <p className={`${textColor} text-sm font-medium`}>{message}</p>
      </div>
    </div>
  );
};
