import { LazyStore } from '@tauri-apps/plugin-store';

const store = new LazyStore('auth.json');

export async function saveToken(token: string) {
  await store.set('jwt', token);
  await store.save();
}

export async function getToken(): Promise<string | null> {
  const val = await store.get<string>('jwt');
  return val ?? null;
}
