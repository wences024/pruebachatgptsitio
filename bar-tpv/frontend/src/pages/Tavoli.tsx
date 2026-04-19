import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSale, creaSala, apriOrdine } from '../lib/api';
import { useToastStore } from '../store/useToastStore';
import { connectSocket } from '../lib/socket';
import { DEMO_TOKEN, DEMO_SALE } from '../lib/demo';
import Modal from '../components/Modal';
import type { Sala, Tavolo, StatoTavolo } from '../../../shared/types';

interface SalaConTavoli extends Sala {
  tavoli: (Tavolo & { ordine_attivo?: { id: string; totale: number; aperto_at: string } | null })[];
}

const statoColore: Record<StatoTavolo, string> = {
  libero: 'bg-[#1f2937] border-[#374151] text-[#6b7280]',
  occupato: 'bg-[#1e1b4b] border-[#4f46e5] text-[#e5e7eb]',
  conto: 'bg-[#451a03] border-[#f59e0b] text-[#e5e7eb]',
};

export default function Tavoli() {
  const navigate = useNavigate();
  const toast = useToastStore(s => s.aggiungi);
  const [sale, setSale] = useState<SalaConTavoli[]>([]);
  const [salaAttiva, setSalaAttiva] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showNuovaSala, setShowNuovaSala] = useState(false);
  const [nuovaSalaNome, setNuovaSalaNome] = useState('');

  const caricaSale = useCallback(async () => {
    const isDemo = localStorage.getItem('bartpv_token') === DEMO_TOKEN;
    if (isDemo) {
      setSale(DEMO_SALE as SalaConTavoli[]);
      if (!salaAttiva) setSalaAttiva(DEMO_SALE[0].id);
      setLoading(false);
      return;
    }
    try {
      const data = await getSale();
      setSale(data);
      if (data.length > 0 && !salaAttiva) setSalaAttiva(data[0].id);
    } catch {
      toast('Errore caricamento sale', 'errore');
    } finally {
      setLoading(false);
    }
  }, [salaAttiva, toast]);

  useEffect(() => {
    caricaSale();
  }, [caricaSale]);

  // Realtime aggiornamento tavoli
  useEffect(() => {
    const socket = connectSocket();
    socket.on('tavolo_aggiornato', () => caricaSale());
    socket.on('ordine_pagato', () => caricaSale());
    return () => {
      socket.off('tavolo_aggiornato');
      socket.off('ordine_pagato');
    };
  }, [caricaSale]);

  const handleTavoloClic = async (tavolo: SalaConTavoli['tavoli'][0]) => {
    const isDemo = localStorage.getItem('bartpv_token') === DEMO_TOKEN;
    if (tavolo.stato === 'libero') {
      if (isDemo) {
        // In demo: segna il tavolo come occupato localmente e naviga
        setSale(prev => prev.map(s => ({
          ...s,
          tavoli: s.tavoli.map(t => t.id === tavolo.id
            ? { ...t, stato: 'occupato' as const, ordine_attivo: { id: `ord-${t.id}`, totale: 0, aperto_at: new Date().toISOString() } as { id: string; totale: number; aperto_at: string } }
            : t),
        })) as SalaConTavoli[]);
        navigate(`/tavoli/${tavolo.id}`);
        return;
      }
      try {
        await apriOrdine(tavolo.id);
        await caricaSale();
        navigate(`/tavoli/${tavolo.id}`);
      } catch {
        toast('Errore apertura tavolo', 'errore');
      }
    } else {
      navigate(`/tavoli/${tavolo.id}`);
    }
  };

  const handleCreaSala = async () => {
    if (!nuovaSalaNome.trim()) return;
    try {
      await creaSala({ nome: nuovaSalaNome.trim(), ordine: sale.length });
      await caricaSale();
      toast('Sala creata');
      setShowNuovaSala(false);
      setNuovaSalaNome('');
    } catch {
      toast('Errore creazione sala', 'errore');
    }
  };

  const salaCorrente = sale.find(s => s.id === salaAttiva);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[#6b7280]">Caricamento...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Tab sale */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#374151] overflow-x-auto shrink-0">
        {sale.map(s => (
          <button
            key={s.id}
            onClick={() => setSalaAttiva(s.id)}
            className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              s.id === salaAttiva
                ? 'bg-[#4f46e5] text-white'
                : 'bg-[#374151] text-[#6b7280] active:bg-[#4b5563]'
            }`}
          >
            {s.nome}
            <span className="ml-1.5 text-xs opacity-70">
              {s.tavoli.filter(t => t.stato !== 'libero').length}/{s.tavoli.length}
            </span>
          </button>
        ))}
        <button
          onClick={() => setShowNuovaSala(true)}
          className="shrink-0 w-9 h-9 bg-[#374151] rounded-lg text-lg flex items-center justify-center active:bg-[#4b5563]"
        >+</button>
      </div>

      {/* Griglia tavoli */}
      <div className="flex-1 overflow-y-auto p-4">
        {salaCorrente ? (
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {salaCorrente.tavoli.map(tavolo => (
              <button
                key={tavolo.id}
                onClick={() => handleTavoloClic(tavolo)}
                className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-colors ${statoColore[tavolo.stato]}`}
              >
                <span className="text-xl font-bold">{tavolo.numero}</span>
                {tavolo.ordine_attivo && (
                  <span className="text-[#f59e0b] text-xs font-semibold">
                    €{Number(tavolo.ordine_attivo.totale).toFixed(2)}
                  </span>
                )}
                <span className="text-[10px] opacity-60 capitalize">
                  {tavolo.stato === 'libero' ? 'libero' :
                   tavolo.stato === 'occupato' ? 'occupato' : 'conto'}
                </span>
              </button>
            ))}
            {salaCorrente.tavoli.length === 0 && (
              <div className="col-span-full flex items-center justify-center h-40">
                <p className="text-[#6b7280] text-sm">Nessun tavolo in questa sala</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-[#6b7280] text-lg mb-2">Nessuna sala configurata</p>
              <button onClick={() => setShowNuovaSala(true)} className="btn-primary">
                + Aggiungi sala
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-4 px-4 py-2 border-t border-[#374151] shrink-0">
        <span className="flex items-center gap-1.5 text-xs text-[#6b7280]">
          <span className="w-3 h-3 rounded-sm bg-[#1f2937] border border-[#374151]" /> Libero
        </span>
        <span className="flex items-center gap-1.5 text-xs text-[#6b7280]">
          <span className="w-3 h-3 rounded-sm bg-[#1e1b4b] border border-[#4f46e5]" /> Occupato
        </span>
        <span className="flex items-center gap-1.5 text-xs text-[#6b7280]">
          <span className="w-3 h-3 rounded-sm bg-[#451a03] border border-[#f59e0b]" /> Conto
        </span>
      </div>

      {/* Modal nuova sala */}
      {showNuovaSala && (
        <Modal titolo="+ Nuova Sala" onClose={() => setShowNuovaSala(false)}>
          <div className="p-5 space-y-4">
            <div>
              <label className="label">Nome sala</label>
              <input
                type="text"
                className="input"
                placeholder="Es: Terrazza, VIP, Giardino..."
                value={nuovaSalaNome}
                onChange={e => setNuovaSalaNome(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreaSala()}
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowNuovaSala(false)} className="btn-ghost flex-1">Annulla</button>
              <button onClick={handleCreaSala} className="btn-primary flex-1">Crea</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
