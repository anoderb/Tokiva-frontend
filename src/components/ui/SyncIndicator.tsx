'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/db';

export function SyncIndicator() {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const updateCount = async () => {
      try {
        const count = await db.pendingSync.count();
        setPendingCount(count);
      } catch (err) {
        console.error('Gagal mengambil jumlah antrian sync:', err);
      }
    };

    // Update count immediately
    updateCount();

    // Check count every 3 seconds
    const interval = setInterval(updateCount, 3000);

    // Also update when online event fires
    window.addEventListener('online', updateCount);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', updateCount);
    };
  }, []);

  if (pendingCount === 0) return null;

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-amber-800 bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 rounded-full shadow-sm">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
      </span>
      {pendingCount} data menunggu sinkronisasi
    </div>
  );
}
