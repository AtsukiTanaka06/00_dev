import { load } from "@tauri-apps/plugin-store";

const STORE_FILE = "settings.bin";

async function getStore() {
  return await load(STORE_FILE, { autoSave: true, defaults: {} });
}

export async function saveKey(key: string, value: string): Promise<void> {
  const store = await getStore();
  await store.set(key, value);
}

export async function loadKey(key: string): Promise<string> {
  const store = await getStore();
  const value = await store.get<string>(key);
  return value ?? "";
}

export async function deleteKey(key: string): Promise<void> {
  const store = await getStore();
  await store.delete(key);
}
