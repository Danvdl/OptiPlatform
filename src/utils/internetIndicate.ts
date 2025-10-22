// src/utils/internetIndicate.ts
export interface NetworkStatus {
  connected: boolean | null;
  onlineEvent: string | null;
  viaWifi: string | null;
}

interface NetworkTrackerOptions {
  onChange: (status: NetworkStatus) => void;
}

export class NetworkTracker {
  private options: NetworkTrackerOptions;
  private intervalId: any;

  constructor(options: NetworkTrackerOptions) {
    this.options = options;
    this.startTracking();
  }

  private startTracking() {
    this.checkConnection(); // initial check

    // Re-check every 5 seconds
    this.intervalId = setInterval(() => this.checkConnection(), 5000);

    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  private handleOnline = () => this.checkConnection('online');
  private handleOffline = () => this.checkConnection('offline');

  private async checkConnection(event?: string) {
    try {
      const testUrl = 'https://jsonplaceholder.typicode.com/todos/1';
      const response = await fetch(testUrl, { method: 'HEAD', cache: 'no-store' });

      const connected = response.ok && navigator.onLine;
      const viaWifi = this.getConnectionType();

      this.options.onChange({
        connected,
        onlineEvent: event || null,
        viaWifi,
      });
    } catch {
      this.options.onChange({
        connected: false,
        onlineEvent: event || null,
        viaWifi: null,
      });
    }
  }

  private getConnectionType(): string | null {
    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;

    if (!connection) return null;
    if (connection.type === 'wifi') return 'Wi-Fi';
    if (connection.type === 'cellular') return 'Mobile Data';
    return null;
  }

  public destroy() {
    clearInterval(this.intervalId);
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }
}
