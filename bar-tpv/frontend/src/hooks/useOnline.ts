import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

export function useOnline() {
  const setOnline = useAppStore(s => s.setOnline);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    setOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [setOnline]);
}
