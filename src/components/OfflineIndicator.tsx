// Offline Status Indicator Component
import { useOfflineIndicator, useTimeSinceSync, useSyncTrigger } from '../hooks/useOfflineStatus';

export default function OfflineIndicator() {
  const { online, syncing, pendingOperations, failedOperations, error, connectionQuality } = useOfflineIndicator();
  const timeSinceSync = useTimeSinceSync();
  const { trigger, loading } = useSyncTrigger();

  // Don't show if everything is normal
  if (online && !syncing && pendingOperations === 0 && !error) {
    return null;
  }

  const handleSyncClick = () => {
    if (!loading && !syncing) {
      trigger().catch(console.error);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`
        rounded-lg shadow-lg p-4 max-w-sm
        ${!online ? 'bg-amber-50 border-2 border-amber-300' : ''}
        ${error ? 'bg-red-50 border-2 border-red-300' : ''}
        ${online && pendingOperations > 0 ? 'bg-blue-50 border-2 border-blue-300' : ''}
      `}>
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          {/* Status Icon */}
          {!online && (
            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
            </svg>
          )}
          
          {syncing && (
            <svg className="w-5 h-5 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}

          {error && (
            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}

          {/* Status Text */}
          <span className={`font-semibold text-sm ${
            !online ? 'text-amber-800' :
            error ? 'text-red-800' :
            'text-blue-800'
          }`}>
            {!online && 'Offline Mode'}
            {syncing && 'Syncing...'}
            {error && 'Sync Error'}
            {online && !syncing && !error && pendingOperations > 0 && 'Pending Changes'}
          </span>
        </div>

        {/* Details */}
        <div className="text-xs text-gray-700 space-y-1">
          {!online && (
            <p>You're working offline. Changes will sync when you reconnect.</p>
          )}

          {pendingOperations > 0 && (
            <p>
              <strong>{pendingOperations}</strong> {pendingOperations === 1 ? 'change' : 'changes'} waiting to sync
            </p>
          )}

          {failedOperations > 0 && (
            <p className="text-red-700">
              <strong>{failedOperations}</strong> {failedOperations === 1 ? 'change' : 'changes'} failed to sync
            </p>
          )}

          {error && (
            <p className="text-red-700 mt-2">
              {error}
            </p>
          )}

          {timeSinceSync && (
            <p className="text-gray-500 mt-2">
              Last synced {timeSinceSync}
            </p>
          )}

          {connectionQuality === 'slow' && (
            <p className="text-amber-700 mt-2">
              ⚠️ Slow connection detected
            </p>
          )}
        </div>

        {/* Actions */}
        {(online && pendingOperations > 0 || error) && (
          <button
            onClick={handleSyncClick}
            disabled={loading || syncing}
            className={`
              mt-3 w-full px-3 py-2 rounded text-sm font-medium
              ${loading || syncing 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : error
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }
              transition-colors
            `}
          >
            {loading || syncing ? 'Syncing...' : error ? 'Retry Sync' : 'Sync Now'}
          </button>
        )}
      </div>
    </div>
  );
}
