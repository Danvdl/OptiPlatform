// React Hook for Offline Status and Sync Indicator
import { useEffect, useState, useCallback } from 'react';
import { useOnlineStatus, useNetworkStatus } from '../db/offline.service';
import { useSyncStatus } from '../db/sync.service';

export interface OfflineIndicatorState {
  online: boolean;
  syncing: boolean;
  lastSyncTime: Date | null;
  pendingOperations: number;
  failedOperations: number;
  error: string | null;
  connectionQuality: 'good' | 'slow' | 'offline';
}

/**
 * Hook for displaying offline/sync status in UI
 * 
 * Example usage:
 * ```tsx
 * const { online, syncing, pendingOperations } = useOfflineIndicator();
 * 
 * return (
 *   <div>
 *     {!online && <Banner>You're offline. Changes will sync when reconnected.</Banner>}
 *     {syncing && <Spinner />}
 *     {pendingOperations > 0 && <Badge>{pendingOperations} pending</Badge>}
 *   </div>
 * );
 * ```
 */
export function useOfflineIndicator(): OfflineIndicatorState {
  const online = useOnlineStatus();
  const network = useNetworkStatus();
  const syncStatus = useSyncStatus();

  // Determine connection quality
  const connectionQuality: 'good' | 'slow' | 'offline' = online
    ? network.effectiveType === '4g' || (network.downlink && network.downlink > 1)
      ? 'good'
      : 'slow'
    : 'offline';

  return {
    online,
    syncing: syncStatus.syncing,
    lastSyncTime: syncStatus.lastSyncTime ? new Date(syncStatus.lastSyncTime) : null,
    pendingOperations: syncStatus.pendingOperations,
    failedOperations: syncStatus.failedOperations,
    error: syncStatus.error,
    connectionQuality,
  };
}

/**
 * Hook for auto-retry functionality
 * Automatically triggers sync when coming back online
 */
export function useAutoSync(enabled = true) {
  const online = useOnlineStatus();
  const syncStatus = useSyncStatus();
  const [previousOnline, setPreviousOnline] = useState(online);

  useEffect(() => {
    if (!enabled) return;

    // Detect transition from offline to online
    if (!previousOnline && online && !syncStatus.syncing) {
      console.log('[useAutoSync] Coming online, triggering sync');
      import('../db/sync.service').then(({ forceSync }) => {
        forceSync().catch(console.error);
      });
    }

    setPreviousOnline(online);
  }, [online, previousOnline, syncStatus.syncing, enabled]);
}

/**
 * Hook to check if offline mode is available
 * Shows banner if service worker isn't registered
 */
export function useOfflineCapability() {
  const [capable, setCapable] = useState(false);
  const [serviceWorkerReady, setServiceWorkerReady] = useState(false);

  useEffect(() => {
    // Check IndexedDB support
    const hasIndexedDB = 'indexedDB' in window;
    
    // Check Service Worker support
    const hasServiceWorker = 'serviceWorker' in navigator;

    setCapable(hasIndexedDB && hasServiceWorker);

    if (hasServiceWorker && navigator.serviceWorker.controller) {
      setServiceWorkerReady(true);
    }

    // Listen for service worker ready
    if (hasServiceWorker) {
      navigator.serviceWorker.ready.then(() => {
        setServiceWorkerReady(true);
      });
    }
  }, []);

  return { capable, serviceWorkerReady };
}

/**
 * Hook to get time since last sync (human readable)
 */
export function useTimeSinceSync(): string | null {
  const syncStatus = useSyncStatus();
  const [display, setDisplay] = useState<string | null>(null);

  useEffect(() => {
    if (!syncStatus.lastSyncTime) {
      setDisplay(null);
      return;
    }

    function updateDisplay() {
      if (!syncStatus.lastSyncTime) return;

      const seconds = Math.floor((Date.now() - syncStatus.lastSyncTime) / 1000);

      if (seconds < 60) {
        setDisplay('Just now');
      } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        setDisplay(`${minutes}m ago`);
      } else if (seconds < 86400) {
        const hours = Math.floor(seconds / 3600);
        setDisplay(`${hours}h ago`);
      } else {
        const days = Math.floor(seconds / 86400);
        setDisplay(`${days}d ago`);
      }
    }

    updateDisplay();
    const interval = setInterval(updateDisplay, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [syncStatus.lastSyncTime]);

  return display;
}

/**
 * Hook for manual sync trigger
 */
export function useSyncTrigger() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trigger = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { forceSync } = await import('../db/sync.service');
      await forceSync();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sync failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { trigger, loading, error };
}
