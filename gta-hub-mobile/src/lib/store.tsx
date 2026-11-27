import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

export type Profile = {
  name: string;
  favorite: string | null;
};

type Persisted = {
  saved: string[];
  recents: string[];
  searches: string[];
  profile: Profile;
};

type StoreValue = Persisted & {
  hydrated: boolean;
  isSaved: (key: string) => boolean;
  toggleSave: (key: string) => boolean;
  pushRecent: (key: string) => void;
  pushSearch: (query: string) => void;
  clearSearches: () => void;
  setProfile: (patch: Partial<Profile>) => void;
  clearRecents: () => void;
};

const STORAGE_KEY = 'gta-hub:you:v1';

const EMPTY: Persisted = {
  saved: [],
  recents: [],
  searches: [],
  profile: { name: 'Player', favorite: null },
};

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Persisted>(EMPTY);
  const [hydrated, setHydrated] = useState(false);
  const skipWrite = useRef(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<Persisted>;
          setState({
            saved: Array.isArray(parsed.saved) ? parsed.saved : [],
            recents: Array.isArray(parsed.recents) ? parsed.recents : [],
            searches: Array.isArray(parsed.searches) ? parsed.searches : [],
            profile: { ...EMPTY.profile, ...(parsed.profile ?? {}) },
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        setHydrated(true);
      });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (skipWrite.current) {
      skipWrite.current = false;
      return;
    }
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, hydrated]);

  const isSaved = useCallback((key: string) => state.saved.includes(key), [state.saved]);

  const toggleSave = useCallback((key: string) => {
    let nextSaved = false;
    setState((current) => {
      const exists = current.saved.includes(key);
      nextSaved = !exists;
      return {
        ...current,
        saved: exists ? current.saved.filter((entry) => entry !== key) : [key, ...current.saved],
      };
    });
    return nextSaved;
  }, []);

  const pushRecent = useCallback((key: string) => {
    setState((current) => ({
      ...current,
      recents: [key, ...current.recents.filter((entry) => entry !== key)].slice(0, 12),
    }));
  }, []);

  const pushSearch = useCallback((query: string) => {
    const clean = query.trim();
    if (clean.length < 2) return;
    setState((current) => ({
      ...current,
      searches: [clean, ...current.searches.filter((entry) => entry.toLowerCase() !== clean.toLowerCase())].slice(
        0,
        6
      ),
    }));
  }, []);

  const clearSearches = useCallback(() => {
    setState((current) => ({ ...current, searches: [] }));
  }, []);

  const clearRecents = useCallback(() => {
    setState((current) => ({ ...current, recents: [] }));
  }, []);

  const setProfile = useCallback((patch: Partial<Profile>) => {
    setState((current) => ({ ...current, profile: { ...current.profile, ...patch } }));
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      ...state,
      hydrated,
      isSaved,
      toggleSave,
      pushRecent,
      pushSearch,
      clearSearches,
      setProfile,
      clearRecents,
    }),
    [
      state,
      hydrated,
      isSaved,
      toggleSave,
      pushRecent,
      pushSearch,
      clearSearches,
      setProfile,
      clearRecents,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
