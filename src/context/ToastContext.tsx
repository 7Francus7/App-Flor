'use client';

import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';

export interface Toast {
  id: string;
  message: string;
  undoFn?: () => void;
  type?: 'info' | 'error' | 'success';
}

interface ToastContextType {
  showToast: (message: string, undoFn?: () => void, type?: Toast['type']) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);
const TOAST_DURATION = 5000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) { clearTimeout(timer); timersRef.current.delete(id); }
  }, []);

  const showToast = useCallback((message: string, undoFn?: () => void, type: Toast['type'] = 'info') => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    setToasts(prev => [...prev.slice(-2), { id, message, undoFn, type }]);
    const timer = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      timersRef.current.delete(id);
    }, TOAST_DURATION);
    timersRef.current.set(id, timer);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{
        position: 'fixed', bottom: 100, left: 16, right: 16,
        zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8,
        pointerEvents: 'none',
      }}>
        {toasts.map(toast => (
          <div
            key={toast.id}
            style={{
              background: toast.type === 'error' ? '#ff3b30' : 'rgba(28,28,30,0.96)',
              color: 'white',
              borderRadius: 14,
              padding: '13px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              pointerEvents: 'all',
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 500, flex: 1 }}>{toast.message}</span>
            {toast.undoFn && (
              <button
                onClick={() => { toast.undoFn!(); dismissToast(toast.id); }}
                style={{
                  background: 'rgba(255,255,255,0.18)', border: 'none', color: 'white',
                  padding: '5px 12px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', flexShrink: 0,
                }}
              >
                Deshacer
              </button>
            )}
            <button
              onClick={() => dismissToast(toast.id)}
              style={{
                background: 'transparent', border: 'none', color: 'white',
                opacity: 0.55, cursor: 'pointer', fontSize: 20, lineHeight: 1,
                padding: 0, flexShrink: 0,
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
