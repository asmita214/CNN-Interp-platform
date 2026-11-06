import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api';

const AtlasContext = createContext(null);

export function AtlasProvider({ children }) {
  const [atlas, setAtlas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/atlas')
      .then((res) => {
        if (!cancelled) {
          setAtlas(res.data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load atlas');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({ atlas, loading, error }),
    [atlas, loading, error],
  );

  return <AtlasContext.Provider value={value}>{children}</AtlasContext.Provider>;
}

export function useAtlas() {
  const ctx = useContext(AtlasContext);
  if (!ctx) throw new Error('useAtlas must be used within AtlasProvider');
  return ctx;
}
