import { BASE_ITEMS } from "@/lib/poe2-item-simulator/baseItems";
import {
  persistSelectedBaseItemKey,
  readPersistedSelectedBaseItemKey,
  SELECTED_BASE_ITEM_KEY_STORAGE_KEY,
} from "@/lib/persistence/selectedBaseItemKeyStorage";

const installMockWindow = (): Map<string, string> => {
  const map = new Map<string, string>();
  (globalThis as { window?: unknown }).window = {
    localStorage: {
      getItem: (key: string): string | null => {
        if (!map.has(key)) {
          return null;
        }
        return map.get(key) ?? null;
      },
      setItem: (key: string, value: string): void => {
        map.set(key, value);
      },
      removeItem: (key: string): void => {
        map.delete(key);
      },
      clear: (): void => {
        map.clear();
      },
      get length(): number {
        return map.size;
      },
      key: (index: number): string | null => {
        return Array.from(map.keys())[index] ?? null;
      },
    },
  } as unknown as Window;
  return map;
};

describe("selectedBaseItemKeyStorage", () => {
  afterEach(() => {
    delete (globalThis as { window?: unknown }).window;
  });

  test("readPersistedSelectedBaseItemKey returns null when window is undefined", () => {
    expect(readPersistedSelectedBaseItemKey()).toBeNull();
  });

  test("persist then read round-trips a valid baseItemKey", () => {
    const map = installMockWindow();
    const key = BASE_ITEMS[0]?.baseItemKey;
    expect(key).toBeDefined();
    if (key === undefined) {
      return;
    }
    persistSelectedBaseItemKey(key);
    expect(map.get(SELECTED_BASE_ITEM_KEY_STORAGE_KEY)).toBe(key);
    expect(readPersistedSelectedBaseItemKey()).toBe(key);
  });

  test("readPersistedSelectedBaseItemKey returns null when stored key is not in BASE_ITEMS", () => {
    installMockWindow();
    persistSelectedBaseItemKey("__not_a_real_base_item_key__");
    expect(readPersistedSelectedBaseItemKey()).toBeNull();
  });

  test("readPersistedSelectedBaseItemKey returns null for empty string in storage", () => {
    const map = installMockWindow();
    map.set(SELECTED_BASE_ITEM_KEY_STORAGE_KEY, "");
    expect(readPersistedSelectedBaseItemKey()).toBeNull();
  });

  test("persistSelectedBaseItemKey ignores errors from localStorage.setItem", () => {
    (globalThis as { window?: unknown }).window = {
      localStorage: {
        setItem: (): void => {
          throw new Error("quota");
        },
        getItem: (): null => null,
        removeItem: (): void => {},
        clear: (): void => {},
        length: 0,
        key: (): null => null,
      },
    } as unknown as Window;
    expect(() => {
      persistSelectedBaseItemKey("any");
    }).not.toThrow();
  });
});
