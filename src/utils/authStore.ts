import { logWarning, logError } from './frontendLogger';

// Check if we're running in Tauri environment
const isTauri = typeof window !== 'undefined' && (window as any).__TAURI__;

let store: any = null;
let storePromise: Promise<void> | null = null;

// Initialize Tauri store only if in Tauri environment
async function initializeStore() {
  if (isTauri && !store && !storePromise) {
    storePromise = (async () => {
      try {
        const { LazyStore } = await import('@tauri-apps/plugin-store');
        store = new LazyStore('auth.json');
      } catch (error) {
        logWarning('Tauri store not available, falling back to localStorage');
      }
    })();
  }
  if (storePromise) {
    await storePromise;
  }
}

export async function saveToken(token: string) {
  try {
    await initializeStore();
    if (store) {
      // Use Tauri store
      await store.set('jwt', token);
      await store.save();
    } else {
      // Fallback to localStorage for web browser
      localStorage.setItem('jwt', token);
    }
  } catch (error) {
    logError(error instanceof Error ? error : new Error('Failed to save token'), { context: 'saveToken' });
    // Fallback to localStorage if Tauri fails
    localStorage.setItem('jwt', token);
  }
}

export async function getToken(): Promise<string | null> {
  try {
    await initializeStore();
    if (store) {
      // Use Tauri store
      const val = await store.get('jwt');
      return val ?? null;
    } else {
      // Fallback to localStorage for web browser
      return localStorage.getItem('jwt');
    }
  } catch (error) {
    logError(error instanceof Error ? error : new Error('Failed to get token'), { context: 'getToken' });
    // Fallback to localStorage if Tauri fails
    return localStorage.getItem('jwt');
  }
}

export async function clearToken() {
  try {
    await initializeStore();
    if (store) {
      // Use Tauri store
      await store.delete('jwt');
      await store.save();
    } else {
      // Fallback to localStorage for web browser
      localStorage.removeItem('jwt');
    }
  } catch (error) {
    logError(error instanceof Error ? error : new Error('Failed to clear token'), { context: 'clearToken' });
    // Fallback to localStorage if Tauri fails
    localStorage.removeItem('jwt');
  }
}
