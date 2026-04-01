'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Card, Button } from '@heroui/react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration: number = 5000) => {
      const id = Math.random().toString(36).substring(2, 9);
      const toast: Toast = { id, message, type, duration };

      setToasts((prev) => [...prev, toast]);

      if (duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
      }
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex w-[360px] flex-col gap-2">
        {toasts.map((toast) => (
          <Card
            key={toast.id}
            className={`animate-in slide-in-from-right fade-in duration-200 rounded-lg border border-border/60 bg-background text-foreground shadow-sm ring-1 ring-black/5 dark:border-white/10 dark:ring-white/10 ${
              toast.type === 'success'
                ? 'border-l-4 border-l-success dark:border-l-success/80'
                : toast.type === 'error'
                  ? 'border-l-4 border-l-danger dark:border-l-danger/80'
                  : toast.type === 'warning'
                    ? 'border-l-4 border-l-warning dark:border-l-warning/80'
                    : 'border-l-4 border-l-muted dark:border-l-muted/80'
            }`}
          >
            <Card.Content className="relative p-3 pr-10">
              <p className="text-sm leading-snug text-foreground/90">
                {toast.message.replace(/\.$/, '')}
              </p>
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                onPress={() => removeToast(toast.id)}
                className="absolute right-2 top-2 h-6 w-6 min-w-6 text-muted-foreground hover:text-foreground"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </Button>
            </Card.Content>
          </Card>
        ))}
      </div>
    </ToastContext.Provider>
  );
}



