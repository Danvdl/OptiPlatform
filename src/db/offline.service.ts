// Offline Detection and Network Status Management
import { useEffect, useState } from 'react';

export interface NetworkStatus {
  online: boolean;
  effectiveType?: string; // '4g', '3g', '2g', 'slow-2g'
  downlink?: number; // Mbps
  rtt?: number; // Round trip time in ms
}

// Network status store
let currentStatus: NetworkStatus = {
  online: navigator.onLine,
};

const listeners = new Set<(status: NetworkStatus) => void>();

// Update network status
function updateNetworkStatus() {
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  
  currentStatus = {
    online: navigator.onLine,
    effectiveType: connection?.effectiveType,
    downlink: connection?.downlink,
    rtt: connection?.rtt,
  };

  listeners.forEach(listener => listener(currentStatus));
}

// Initialize network listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);

  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  if (connection) {
    connection.addEventListener('change', updateNetworkStatus);
  }
}

// Subscribe to network status changes
export function subscribeToNetworkStatus(listener: (status: NetworkStatus) => void): () => void {
  listeners.add(listener);
  listener(currentStatus); // Immediate call with current status
  
  return () => {
    listeners.delete(listener);
  };
}

// Get current network status
export function getNetworkStatus(): NetworkStatus {
  return currentStatus;
}

// Check if online
export function isOnline(): boolean {
  return currentStatus.online;
}

// React hook for network status
export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>(currentStatus);

  useEffect(() => {
    return subscribeToNetworkStatus(setStatus);
  }, []);

  return status;
}

// React hook for simple online/offline
export function useOnlineStatus(): boolean {
  const status = useNetworkStatus();
  return status.online;
}

// Check if connection is fast enough for large operations
export function isFastConnection(): boolean {
  const { effectiveType, downlink } = currentStatus;
  
  // If we can measure downlink, use that
  if (downlink !== undefined) {
    return downlink > 1; // > 1 Mbps
  }

  // Otherwise use effective type
  return effectiveType === '4g';
}

// Wait for online status
export function waitForOnline(timeout = 30000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isOnline()) {
      resolve();
      return;
    }

    const timer = setTimeout(() => {
      unsubscribe();
      reject(new Error('Timeout waiting for online status'));
    }, timeout);

    const unsubscribe = subscribeToNetworkStatus((status) => {
      if (status.online) {
        clearTimeout(timer);
        unsubscribe();
        resolve();
      }
    });
  });
}

// Log network status changes
subscribeToNetworkStatus((status) => {
  console.log('[Network]', status.online ? 'Online' : 'Offline', status);
});
