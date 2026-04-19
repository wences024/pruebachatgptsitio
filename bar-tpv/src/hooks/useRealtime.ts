import { useEffect } from 'react';
import { connectSocket, disconnectSocket } from '../lib/socket';
import { useAppStore } from '../store/useAppStore';
import { useToastStore } from '../store/useToastStore';

export function useRealtime() {
  const aggiornaStock = useAppStore(s => s.aggiornaStock);
  const toast = useToastStore(s => s.aggiungi);

  useEffect(() => {
    const socket = connectSocket();

    socket.on('stock_aggiornato', ({ prodotto_id, stock }: { prodotto_id: string; stock: number }) => {
      aggiornaStock(prodotto_id, stock);
    });

    socket.on('tavolo_aggiornato', () => {
      // Invalida la cache locale delle sale — le pagine usano refetch
    });

    socket.on('connect_error', () => {
      // Silenzioso — l'indicatore Online/Offline gestisce la UI
    });

    return () => {
      socket.off('stock_aggiornato');
      socket.off('tavolo_aggiornato');
      disconnectSocket();
    };
  }, [aggiornaStock, toast]);
}
