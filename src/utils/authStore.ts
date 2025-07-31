// Check if we're running in Tauri environment
const isTauri = typeof window !== 'undefined' && (window as any).__TAURI__;

let store: any = null;

// Initialize Tauri store only if in Tauri environment
if (isTauri) {
  try {
    const { LazyStore } = await import('@tauri-apps/plugin-store');
    store = new LazyStore('auth.json');
  } catch (error) {
    console.warn('Tauri store not available, falling back to localStorage');
  }
}

export async function saveToken(token: string) {
  try {
    if (store) {
      // Use Tauri store
      await store.set('jwt', token);
      await store.save();
    } else {
      // Fallback to localStorage for web browser
      localStorage.setItem('jwt', token);
    }
  } catch (error) {
    console.error('Failed to save token:', error);
    // Fallback to localStorage if Tauri fails
    localStorage.setItem('jwt', token);
  }
}

export async function getToken(): Promise<string | null> {
  try {
    if (store) {
      // Use Tauri store
      const val = await store.get('jwt');
      return val ?? null;
    } else {
      // Fallback to localStorage for web browser
      return localStorage.getItem('jwt');
    }
  } catch (error) {
    console.error('Failed to get token:', error);
    // Fallback to localStorage if Tauri fails
    return localStorage.getItem('jwt');
  }
}

export async function clearToken() {
  try {
    if (store) {
      // Use Tauri store
      await store.delete('jwt');
      await store.save();
    } else {
      // Fallback to localStorage for web browser
      localStorage.removeItem('jwt');
    }
  } catch (error) {
    console.error('Failed to clear token:', error);
    // Fallback to localStorage if Tauri fails
    localStorage.removeItem('jwt');
  }
}
