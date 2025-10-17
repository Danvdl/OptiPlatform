export interface NetworkStatus {
  connected: boolean | null;
  onlineEvent: boolean | null;
  viaWifi: string | null;
}

interface TrackerOptions {
  onChange: (status: NetworkStatus) => void;
}

export class NetworkTracker {
  private onChange: (status: NetworkStatus) => void;

  constructor({ onChange }: TrackerOptions) {
    this.onChange = onChange;
    this.checkConnection();

    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  private handleOnline = () => this.checkConnection();
  private handleOffline = () =>
    this.onChange({
      connected: false,
      onlineEvent: false,
      viaWifi: this.getConnectionType(),
    });

  private getConnectionType(): string | null {
    return (navigator as any).connection?.type || null;
  }

  private async checkConnection() {
    let hasInternet = false;

    if (navigator.onLine) {
      try {
        const res = await fetch('https://www.gstatic.com/generate_204', {
          method: 'HEAD',
          cache: 'no-store',
        });
        hasInternet = res.ok;
      } catch {
        hasInternet = false;
      }
    }

    this.onChange({
      connected: hasInternet,
      onlineEvent: navigator.onLine,
      viaWifi: this.getConnectionType(),
    });
  }

  destroy() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }
}
