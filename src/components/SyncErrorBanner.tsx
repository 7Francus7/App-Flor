'use client';

import { useStore } from '@/store/StoreContext';
import { WarningIcon } from './Icons';

export function SyncErrorBanner() {
  const { syncError } = useStore();

  if (!syncError) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9998,
        padding: '10px 16px',
        background: 'rgba(255,149,0,0.95)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        fontSize: 13,
        fontWeight: 600,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      <WarningIcon size={15} /> Sin conexión con la base de datos — datos locales activos
    </div>
  );
}
