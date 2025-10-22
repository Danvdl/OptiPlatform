// src/utils/InternetIndicator.tsx
import React, { useEffect, useState } from 'react';
import { NetworkTracker, NetworkStatus } from './internetIndicate';

const InternetIndicator: React.FC = () => {
  const [status, setStatus] = useState<NetworkStatus>({
    connected: null,
    onlineEvent: null,
    viaWifi: null,
  });

  useEffect(() => {
    const tracker = new NetworkTracker({
      onChange: (updatedStatus) => {
        setStatus(updatedStatus);
      },
    });

    return () => tracker.destroy();
  }, []);

  // Determine display label
  const label = status.connected
    ? status.viaWifi
      ? `Online (${status.viaWifi})`
      : 'Online'
    : 'Offline';

  // Choose colors
  const color = status.connected ? '#22c55e' : '#ef4444'; // green/red
  const bg = status.connected
    ? 'rgba(34, 197, 94, 0.15)'
    : 'rgba(239, 68, 68, 0.15)';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        background: bg,
        border: `1px solid ${color}`,
        color,
        borderRadius: '0.5rem',
        padding: '0.5rem 0.75rem',
        fontSize: '0.875rem',
        fontWeight: 500,
        width: 'fit-content',
        margin: '0 auto',
        transition: 'all 0.3s ease',
      }}
    >
      <span
        style={{
          display: 'inline-block',
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          background: color,
        }}
      ></span>
      <span>{label}</span>
    </div>
  );
};

export default InternetIndicator;
