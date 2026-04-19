import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { useToastStore } from '../store/useToastStore';
import { DEMO_TOKEN } from '../lib/demo';
import {
  getOrdineAttivo, aggiungiRiga, modificaRiga, eliminaRiga, liberaTavolo
} from '../lib/api';
import { connectSocket } from '../lib/socket';
import type { Ordine, RigaOrdine, Prodotto } from '../../../shared/types';
import Modal from '../components/Modal';
import AttributiModal from '../components/modals/AttributiModal';
import PannelloIncasso from '../components/PannelloIncasso';

export default function DettaglioTavolo() {
  const { id: tavolo_id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToastStore(s => s.aggiungi);
  const prodotti = useAppStore(s => s.prodotti);
  const categorie = useAppStore(s => s.categorie);
  const attributi = useAppStore(s => s.attributi);

  const [ordine, setOrdine] = useState<Ordine | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAggiungi, setShowAggiungi] = useState(false);
  const [modificaRigaId, setModificaRigaId] = useState<string | null>(null);
  const [catAggiungi, setCatAggiungi] = useState<string>('tutte');
  const [prodottoAttrs, setProdottoAttrs] = useState<Prodotto | null>(null);
  const [qtaLocali, setQtaLocali] = useState<Record<string, number>>({});

  const caricaOrdine = useCallback(async () => {
    if (!tavolo_id) return;
    const isDemo = localStorage.getItem('bartpv_token') === DEMO_TOKEN;
    if (isDemo) {
      // In demo: crea un ordine vuoto fittizio
      setOrdine(prev => prev ?? {
        id: `ord-${tavolo_id}`,
        tavolo_id,
        aperto_at: new Date().toISOString(),
        stato: 'aperto',
        totale: 0,
        righe: [],
      });
      setLoading(false);
      return;
    }
    try {
      const data = await getOrdineAttivo(tavolo_id);
      setOrdine(data);
      if (!data) navigate('/tavoli');
    } catch {
      toast('Errore caricamento ordine', 'errore');
    } finally {
      setLoading(false);
    }
  }, [tavolo_id, navigate, toast]);

  useEffect(() => { caricaOrdine(); }, [caricaOrdine]);

  // Realtime
  useEffect(() => {
    if (!ordine?.id) return;
    const socket = connectSocket();
    socket.emit('join_ordine', ordine.id);
    socket.on('riga_aggiunta', () => caricaOrdine());
    socket.on('riga_rimossa', () => caricaOrdine());
    socket.on('ordine_pagato', () => navigate('/tavoli'));
    return () => {
      socket.emit('leave_ordine', ordine.id);
      socket.off('riga_aggiunta');
      socket.off('riga_rimossa');
      socket.off('ordine_pagato');
    };
  }, [ordine?.id, caricaOrdine, navigate]);

  const righe: RigaOrdine[] = ordine?.righe ?? [];
  const righeSelezionate = righe.filter(r => r.selezionata);
  const totale = righe.reduce((s, r) => s + r.quantita * r.prezzo_unitario, 0);

  const toggleSelezione = (riga: RigaOrdine) => {
    if (!ordine) return;
    const nuove = righe.map(r =>
      r.id === riga.id ? { ...r, selezionata: !r.selezionata } : r
    );
    setOrdine({ ...ordine, righe: nuove });
  };

  const handleEliminaRiga = async (riga_id: string) => {
    if (!ordine) return;
    const isDemo = localStorage.getItem('bartpv_token') === DEMO_TOKEN;
    if (isDemo) {
      setOrdine(prev => prev ? { ...prev, righe: (prev.righe ?? []).filter(r => r.id !== riga_id) } : prev);
      toast('Prodotto rimosso');
      return;
    }
    try {
      await eliminaRiga(ordine.id, riga_id);
      await caricaOrdine();
      toast('Prodotto rimosso');
    } catch {
      toast('Errore rimozione prodotto', 'errore');
    }
  };

  const handleModificaConferma = async (dati: {
    quantita: number; prezzo_unitario: number;
    attributi_selezionati: Record<string, string[]>; nota: string;
  }) => {
    if (!ordine || !modificaRigaId) return;
    try {
      await modificaRiga(ordine.id, modificaRigaId, dati);
      await caricaOrdine();
      setModificaRigaId(null);
      toast('Prodotto aggiornato');
    } catch {
      toast('Errore aggiornamento', 'errore');
    }
  };

  const handleAggiungiProdotto = async (prodotto: Prodotto, dati: {
    quantita: number; prezzo_unitario: number;
    attributi_selezionati: Record<string, string[]>; nota: string;
  }) => {
    if (!ordine) return;
    const isDemo = localStorage.getItem('bartpv_token') === DEMO_TOKEN;
    if (isDemo) {
      const nuovaRiga = {
        id: `riga-${Date.now()}`, ordine_id: ordine.id,
        prodotto_id: prodotto.id, nome_prodotto: prodotto.nome,
        selezionata: false, creato_at: new Date().toISOString(), ...dati,
      };
      setOrdine(prev => prev ? { ...prev, righe: [...(prev.righe ?? []), nuovaRiga] } : prev);
      setProdottoAttrs(null); setQtaLocali({});
      toast(`+ ${prodotto.nome}`);
      return;
    }
    try {
      await aggiungiRiga(ordine.id, { prodotto_id: prodotto.id, ...dati });
      await caricaOrdine();
      setProdottoAttrs(null);
      setQtaLocali({});
      toast(`+ ${prodotto.nome}`);
    } catch {
      toast('Errore aggiunta prodotto', 'errore');
    }
  };

  const handleAggiungiDiretto = async (prodotto: Prodotto) => {
    setQtaLocali(p => ({ ...p, [prodotto.id]: (p[prodotto.id] ?? 0) + 1 }));
    if (!ordine) return;
    const isDemo = localStorage.getItem('bartpv_token') === DEMO_TOKEN;
    if (isDemo) {
      handleAggiungiProdotto(prodotto, { quantita: 1, prezzo_unitario: prodotto.prezzo, attributi_selezionati: {}, nota: '' });
      return;
    }
    try {
      await aggiungiRiga(ordine.id, { prodotto_id: prodotto.id, quantita: 1, prezzo_unitario: prodotto.prezzo, attributi_selezionati: {}, nota: '' });
      await caricaOrdine();
    } catch {
      toast('Errore aggiunta prodotto', 'errore');
    }
  };

  const handleLiberaTavolo = async () => {
    if (!ordine) return;
    if (!confirm('Liberare il tavolo? L\'ordine verrà chiuso.')) return;
    const isDemo = localStorage.getItem('bartpv_token') === DEMO_TOKEN;
    if (isDemo) { toast('Tavolo liberato'); navigate('/tavoli'); return; }
    try {
      await liberaTavolo(ordine.id);
      toast('Tavolo liberato');
      navigate('/tavoli');
    } catch {
      toast('Errore liberazione tavolo', 'errore');
    }
  };

  const prodottiFiltrati = prodotti.filter(p =>
    p.attivo && (catAggiungi === 'tutte' || p.categoria_id === catAggiungi)
  );

  const minutiAperti = ordine
    ? Math.floor((Date.now() - new Date(ordine.aperto_at).getTime()) / 60000)
    : 0;

  const rigaInModifica = modificaRigaId ? righe.find(r => r.id === modificaRigaId) : null;
  const prodottoInModifica = rigaInModifica ? prodotti.find(p => p.id === rigaInModifica.prodotto_id) : null;

  const scontrinoRighe = righe.map(r => ({
    id: r.id,
    prodotto_id: r.prodotto_id ?? '',
    nome_prodotto: r.nome_prodotto,
    quantita: r.quantita,
    prezzo_unitario: r.prezzo_unitario,
    attributi_selezionati: r.attributi_selezionati,
    nota: r.nota,
    selezionata: r.selezionata,
  }));

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[#6b7280]">Caricamento...</p>
      </div>
    );
  }

  if (!ordine) return null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#374151] shrink-0">
        <button onClick={() => navigate('/tavoli')} className="text-[#6b7280] text-sm active:text-[#e5e7eb]">
          ← Indietro
        </button>
        <div className="flex-1">
          <h1 className="text-[#e5e7eb] font-bold">
            Tavolo {/* numero non disponibile qui, mostrato dopo */}
          </h1>
          <p className="text-[#6b7280] text-xs">Aperto da {minutiAperti} min · {righe.length} prodotti</p>
        </div>
        <button onClick={() => setShowAggiungi(true)} className="btn-primary text-sm px-3 py-2">
          + Prodotto
        </button>
        <button onClick={handleLiberaTavolo} className="btn-danger text-sm px-3 py-2">
          Libera
        </button>
      </div>

      {/* Layout 2 colonne */}
      <div className="flex-1 flex overflow-hidden">
        {/* Lista prodotti */}
        <div className="flex-1 overflow-y-auto p-3">
          {righe.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-[#6b7280] text-sm">Nessun prodotto — aggiungi qualcosa</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {righe.map(riga => (
                <div
                  key={riga.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                    riga.selezionata ? 'bg-[#1e1b4b]/40 border-[#4f46e5]/30' : 'bg-[#1f2937] border-[#374151]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={riga.selezionata}
                    onChange={() => toggleSelezione(riga)}
                    className="w-5 h-5 accent-[#4f46e5] shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => setModificaRigaId(riga.id)}
                      className="text-left w-full"
                    >
                      <p className="text-[#e5e7eb] text-sm font-medium">
                        {riga.nome_prodotto}
                      </p>
                      {Object.keys(riga.attributi_selezionati).length > 0 && (
                        <p className="text-[#6b7280] text-xs">
                          {Object.values(riga.attributi_selezionati).flat().join(' · ')}
                        </p>
                      )}
                      {riga.nota && (
                        <p className="text-[#6b7280] text-xs italic">{riga.nota}</p>
                      )}
                    </button>
                  </div>
                  <span className="text-[#6b7280] text-sm">{riga.quantita}×</span>
                  <span className="text-[#f59e0b] font-semibold text-sm w-16 text-right">
                    €{(riga.quantita * riga.prezzo_unitario).toFixed(2)}
                  </span>
                  <button
                    onClick={() => handleEliminaRiga(riga.id)}
                    className="text-[#6b7280] w-8 h-8 flex items-center justify-center rounded-lg active:bg-[#374151]"
                  >✕</button>
                </div>
              ))}
            </div>
          )}

          {/* Totali */}
          <div className="mt-4 p-3 bg-[#1f2937] rounded-xl border border-[#374151]">
            <div className="flex justify-between text-sm">
              <span className="text-[#6b7280]">Totale tavolo</span>
              <span className="text-[#e5e7eb] font-bold">€ {totale.toFixed(2)}</span>
            </div>
            {righeSelezionate.length > 0 && (
              <div className="flex justify-between text-sm mt-1">
                <span className="text-[#6b7280]">Selezione ({righeSelezionate.length})</span>
                <span className="text-[#f59e0b] font-semibold">
                  € {righeSelezionate.reduce((s, r) => s + r.quantita * r.prezzo_unitario, 0).toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Pannello incasso */}
        <div className="w-[210px] shrink-0 p-3 pl-0">
          <PannelloIncasso
            ordine_id={ordine.id}
            righe={scontrinoRighe}
            onPagato={() => navigate('/tavoli')}
          />
        </div>
      </div>

      {/* Modal aggiungi prodotto */}
      {showAggiungi && (
        <Modal titolo="+ Aggiungi Prodotto" onClose={() => setShowAggiungi(false)} larghezza="max-w-2xl">
          <div className="flex flex-col" style={{ height: '70vh' }}>
            {/* Categorie */}
            <div className="flex gap-2 px-4 py-3 border-b border-[#374151] overflow-x-auto shrink-0">
              <button
                onClick={() => setCatAggiungi('tutte')}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${
                  catAggiungi === 'tutte' ? 'bg-[#4f46e5] text-white' : 'bg-[#374151] text-[#6b7280]'
                }`}
              >Tutte</button>
              {categorie.map(c => (
                <button
                  key={c.id}
                  onClick={() => setCatAggiungi(c.id)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${
                    catAggiungi === c.id ? 'bg-[#4f46e5] text-white' : 'bg-[#374151] text-[#6b7280]'
                  }`}
                >{c.emoji} {c.nome}</button>
              ))}
            </div>

            {/* Griglia prodotti */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {prodottiFiltrati.map(p => (
                  <div key={p.id} className="bg-[#111827] border border-[#374151] rounded-xl p-3 flex flex-col items-center gap-1">
                    <span className="text-2xl">{p.emoji ?? '🍽️'}</span>
                    <span className="text-[#e5e7eb] text-xs text-center font-medium">{p.nome}</span>
                    <span className="text-[#f59e0b] text-sm font-bold">€{p.prezzo.toFixed(2)}</span>
                    {(p.attributi_ids?.length ?? 0) > 0 ? (
                      <button
                        onClick={() => setProdottoAttrs(p)}
                        className="w-full mt-1 py-1.5 bg-[#4f46e5] text-white text-xs rounded-lg font-medium active:bg-[#4338ca]"
                      >+ opzioni</button>
                    ) : (
                      <button
                        onClick={() => handleAggiungiDiretto(p)}
                        className="w-full mt-1 py-1.5 bg-[#374151] text-[#e5e7eb] text-xs rounded-lg active:bg-[#4b5563]"
                      >+ Aggiungi</button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Sul tavolo ora */}
            {righe.length > 0 && (
              <div className="border-t border-[#374151] p-4 shrink-0">
                <p className="label mb-2">Sul tavolo ora</p>
                <div className="space-y-1 max-h-28 overflow-y-auto">
                  {righe.map(r => (
                    <div key={r.id} className="flex items-center gap-2 text-sm">
                      <span className="flex-1 text-[#e5e7eb] truncate">{r.nome_prodotto}</span>
                      <span className="text-[#6b7280]">{r.quantita}×</span>
                      <span className="text-[#f59e0b] w-14 text-right">€{(r.quantita * r.prezzo_unitario).toFixed(2)}</span>
                      <button
                        onClick={() => handleEliminaRiga(r.id)}
                        className="text-[#6b7280] text-xs w-6 h-6 flex items-center justify-center"
                      >✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="p-4 border-t border-[#374151] shrink-0">
              <button onClick={() => setShowAggiungi(false)} className="btn-ghost w-full">Chiudi</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal attributi per prodotto con opzioni */}
      {prodottoAttrs && (
        <AttributiModal
          prodotto={prodottoAttrs}
          attributi={attributi}
          onConferma={(dati) => handleAggiungiProdotto(prodottoAttrs, dati)}
          onAnnulla={() => setProdottoAttrs(null)}
        />
      )}

      {/* Modal modifica riga */}
      {rigaInModifica && prodottoInModifica && (
        <AttributiModal
          prodotto={prodottoInModifica}
          attributi={attributi}
          quantitaIniziale={rigaInModifica.quantita}
          prezzoIniziale={rigaInModifica.prezzo_unitario}
          attributiIniziali={rigaInModifica.attributi_selezionati}
          notaIniziale={rigaInModifica.nota}
          titoloPulsante="Salva"
          mostraElimina
          onElimina={() => { handleEliminaRiga(rigaInModifica.id); setModificaRigaId(null); }}
          onConferma={handleModificaConferma}
          onAnnulla={() => setModificaRigaId(null)}
        />
      )}
    </div>
  );
}
