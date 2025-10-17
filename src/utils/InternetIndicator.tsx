import React, { useEffect, useState } from 'react';
import { NetworkTracker, NetworkStatus } from './internetIndicate'; // named import

export default function InternetIndicator() {
  const [status, setStatus] = useState<NetworkStatus>({
    connected: null,
    onlineEvent: null,
    viaWifi: null,
  });

  useEffect(() => {
    const tracker = new NetworkTracker({
      onChange: (newStatus: NetworkStatus) => setStatus(newStatus),
    });

    return () => tracker.destroy();
  }, []);

  const getLabel = () => {
    if (status.connected === null) return 'Checking...';
    return status.connected ? '🟢 Online' : '🔴 Offline';
  };

  return (
    <div style={{
      padding: '0.25rem 0.5rem',
      borderRadius: '0.5rem',
      fontSize: '0.75rem',
      fontWeight: 600,
      background: status.connected ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
      color: status.connected ? '#22c55e' : '#ef4444',
      display: 'inline-block'
    }}>
      {getLabel()}
      {status.viaWifi ? ` | ${status.viaWifi}` : ''}
    </div>
  );
}
