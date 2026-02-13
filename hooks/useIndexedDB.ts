import { useState, useEffect, useCallback, useRef } from 'react';
import { db, type SettingsEntry } from '../utils/db';
import type { Table } from 'dexie';

/**
 * Hook for syncing an array state with a Dexie table.
 * Replaces useStickyState for array-based data (tasks, notes, etc.)
 */
export function useIndexedDBTable<T extends { id: string }>(
  table: Table<T, string>,
  defaultValue: T[],
  lsFallbackKey: string
): [T[], React.Dispatch<React.SetStateAction<T[]>>, boolean] {
  const [data, setData] = useState<T[]>(() => {
    // Initial load from localStorage as fallback for instant render
    try {
      const cached = localStorage.getItem(lsFallbackKey);
      return cached ? JSON.parse(cached) : defaultValue;
    } catch {
      return defaultValue;
    }
  });
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  // Load from IndexedDB on mount
  useEffect(() => {
    let cancelled = false;
    table.toArray().then(items => {
      if (cancelled) return;
      if (items.length > 0) {
        setData(items);
      }
      initialized.current = true;
      setLoading(false);
    }).catch(() => {
      initialized.current = true;
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [table]);

  // Sync changes back to IndexedDB and localStorage
  useEffect(() => {
    if (!initialized.current) return;
    // Write to IndexedDB
    table.clear().then(() => {
      if (data.length > 0) {
        return table.bulkPut(data);
      }
    }).catch(err => {
      console.error(`IndexedDB write error for table:`, err);
    });
    // Also keep localStorage in sync as fallback
    try {
      localStorage.setItem(lsFallbackKey, JSON.stringify(data));
    } catch { /* ignore */ }
  }, [data, table, lsFallbackKey]);

  return [data, setData, loading];
}

/**
 * Hook for syncing a single setting value with IndexedDB settings table.
 * Replaces useStickyState for scalar values (theme, page, etc.)
 */
export function useIndexedDBSetting<T>(
  key: string,
  defaultValue: T,
  lsFallbackKey: string
): [T, React.Dispatch<React.SetStateAction<T>>, boolean] {
  const [value, setValue] = useState<T>(() => {
    try {
      const cached = localStorage.getItem(lsFallbackKey);
      return cached !== null ? JSON.parse(cached) : defaultValue;
    } catch {
      return defaultValue;
    }
  });
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  // Load from IndexedDB on mount
  useEffect(() => {
    let cancelled = false;
    db.settings.get(key).then((entry: SettingsEntry | undefined) => {
      if (cancelled) return;
      if (entry !== undefined) {
        setValue(entry.value as T);
      }
      initialized.current = true;
      setLoading(false);
    }).catch(() => {
      initialized.current = true;
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [key]);

  // Sync changes back to IndexedDB and localStorage
  useEffect(() => {
    if (!initialized.current) return;
    db.settings.put({ key, value }).catch(err => {
      console.error(`IndexedDB settings write error for key "${key}":`, err);
    });
    try {
      localStorage.setItem(lsFallbackKey, JSON.stringify(value));
    } catch { /* ignore */ }
  }, [value, key, lsFallbackKey]);

  return [value, setValue, loading];
}
