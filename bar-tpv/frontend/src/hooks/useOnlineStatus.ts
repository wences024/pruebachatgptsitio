import { useEffect } from 'react';
import { useUiStore } from '@/store/ui';

export function useOnlineStatus() {
  const setOnline = useUiStore((state) => state.setOnline);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    update();
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, [setOnline]);
}
