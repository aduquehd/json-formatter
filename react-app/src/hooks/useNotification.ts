'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Notyf } from 'notyf';
import 'notyf/notyf.min.css';

export function useNotification() {
  const notyfRef = useRef<Notyf | null>(null);

  useEffect(() => {
    notyfRef.current = new Notyf({
      duration: 5000,
      position: {
        x: 'right',
        y: 'top',
      },
      types: [
        {
          type: 'success',
          background: '#10b981',
        },
        {
          type: 'error',
          background: '#ef4444',
        },
        {
          type: 'warning',
          background: '#f59e0b',
          icon: false,
        },
        {
          type: 'info',
          background: '#3b82f6',
          icon: false,
        },
      ],
    });

    return () => {
      notyfRef.current?.dismissAll();
    };
  }, []);

  const showSuccess = useCallback((message: string) => {
    notyfRef.current?.success(message);
  }, []);

  const showError = useCallback((message: string) => {
    notyfRef.current?.error(message);
  }, []);

  const showWarning = useCallback((message: string) => {
    notyfRef.current?.open({
      type: 'warning',
      message,
    });
  }, []);

  const showInfo = useCallback((message: string) => {
    notyfRef.current?.open({
      type: 'info',
      message,
    });
  }, []);

  return { showSuccess, showError, showWarning, showInfo };
}