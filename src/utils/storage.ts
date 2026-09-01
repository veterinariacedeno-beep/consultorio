import localforage from "localforage";

// Configure localforage to use IndexedDB with a dedicated store
localforage.config({
  name: "VetCedenoDB",
  storeName: "vet_data",
  description: "Consultorio Veterinario Dr. Cedeño — IndexedDB storage",
});

// Keys that map to the old localStorage keys
const STORAGE_KEYS = [
  "vc_owners",
  "vc_pets",
  "vc_services",
  "vc_invoices",
  "vc_weekly_snapshots",
  "vc_appointments",
  "vc_pharmacy_items",
  "vc_pharmacy_sales",
  "vc_expenses",
  "vc_debts",
  "vc_cert_records",
  "vc_lab_records",
] as const;

type StorageKey = (typeof STORAGE_KEYS)[number];

const MIGRATION_FLAG = "vc_indexeddb_migrated";

/**
 * Migrate data from localStorage to IndexedDB on first load.
 * After successful migration, removes all old localStorage keys to free space.
 * Returns true if migration happened (or was already done), false on failure.
 */
export async function migrateFromLocalStorage(): Promise<boolean> {
  try {
    const alreadyMigrated = localStorage.getItem(MIGRATION_FLAG);
    if (alreadyMigrated === "true") return true;

    let migratedCount = 0;
    for (const key of STORAGE_KEYS) {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        try {
          const parsed = JSON.parse(raw);
          await localforage.setItem(key, parsed);
          migratedCount++;
        } catch {
          // If a single key fails, continue with the rest
        }
      }
    }

    // Clean up localStorage regardless — even if some keys failed,
    // removing the ones we successfully migrated frees space
    for (const key of STORAGE_KEYS) {
      localStorage.removeItem(key);
    }

    localStorage.setItem(MIGRATION_FLAG, "true");
    return true;
  } catch {
    return false;
  }
}

export async function loadData<T>(key: StorageKey, fallback: T): Promise<T> {
  try {
    const value = await localforage.getItem<T>(key);
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

export async function saveData<T>(key: StorageKey, value: T): Promise<void> {
  try {
    await localforage.setItem(key, value);
  } catch {
    // IndexedDB has much higher limits than localStorage;
    // if this still fails, surface the error to the user
    console.error("Error guardando en IndexedDB:", key);
  }
}
