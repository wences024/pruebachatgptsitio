import { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useScontrinoStore } from '../store/useScontrinoStore';
import { useToastStore } from '../store/useToastStore';
import { apriOrdine } from '../lib/api';
import type { Prodotto } from '../../../shared/types';
import AttributiModal from '../components/modals/AttributiModal';
import Scontrino from '../components/Scontrino';
import { v4 as uuidv4 } from 'uuid';

export default function PagamentoRapido() {
  const categorie = useAppStore(s => s.categorie);
  const prodotti = useAppStore(s => s.prodotti);
  const attributi = useAppStore(s => s.attributi);
  const { ordine_id, setOrdineId, aggiungiRiga, aggiornaRiga } = useScontrinoStore();
  const toast = useToastStore(s => s.aggiungi);

  const [categoriaAttiva, setCategoriaAttiva] = useState<string>('tutte');
  const [prodottoModal, setProdottoModal] = useState<Prodotto | null>(null);

  // Inizializza ordine rapido se non esiste
  useEffect(() => {
    if (!ordine_id) {
      apriOrdine()
        .then(o => setOrdineId(o.id))
        .catch(() => {}); // ordine gestito localmente se offline
    }
  }, [ordine_id, setOrdineId]);

  const prodottiFiltrati = prodotti.filter(p => {
    if (categoriaAttiva !== 'tutte' && p.categoria_id !== categoriaAttiva) return false;
    return p.attivo;
  });

  const handleProdottoClic = (prodotto: Prodotto) => {
    if ((prodotto.attributi_ids?.length ?? 0) > 0) {
      setProdottoModal(prodotto);
    } else {
      aggiungiAlScontrino(prodotto, { quantita: 1, prezzo_unitario: prodotto.prezzo, attributi_selezionati: {}, nota: '' });
    }
  };

  const aggiungiAlScontrino = (prodotto: Prodotto, dati: {
    quantita: number; prezzo_unitario: number;
    attributi_selezionati: Record<string, string[]>; nota: string;
  }) => {
    const id = uuidv4();
    aggiungiRiga({ id, prodotto_id: prodotto.id, nome_prodotto: prodotto.nome, ...dati });
    toast(`+ ${prodotto.nome}`);
    setProdottoModal(null);
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Area sinistra: categorie + prodotti */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Filtro categorie */}
        <div className="flex gap-2 px-3 py-2 overflow-x-auto shrink-0 scrollbar-none">
          <button
            onClick={() => setCategoriaAttiva('tutte')}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              categoriaAttiva === 'tutte'
                ? 'bg-[#4f46e5] text-white'
                : 'bg-[#374151] text-[#6b7280] active:bg-[#4b5563]'
            }`}
          >
            Tutte
          </button>
          {categorie.map(c => (
            <button
              key={c.id}
              onClick={() => setCategoriaAttiva(c.id)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                categoriaAttiva === c.id
                  ? 'bg-[#4f46e5] text-white'
                  : 'bg-[#374151] text-[#6b7280] active:bg-[#4b5563]'
              }`}
            >
              {c.emoji} {c.nome}
            </button>
          ))}
        </div>

        {/* Griglia prodotti */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {prodottiFiltrati.map(prodotto => (
              <button
                key={prodotto.id}
                onClick={() => handleProdottoClic(prodotto)}
                className="bg-[#1f2937] border border-[#374151] rounded-xl p-3 text-left active:bg-[#374151] transition-colors flex flex-col items-center gap-1 min-h-[80px] relative"
              >
                {(prodotto.attributi_ids?.length ?? 0) > 0 && (
                  <span className="absolute top-1.5 right-1.5 text-[9px] bg-[#4f46e5]/30 text-[#a5b4fc] px-1.5 py-0.5 rounded-full font-medium">
                    ★ opz.
                  </span>
                )}
                <span className="text-2xl">{prodotto.emoji ?? '🍽️'}</span>
                <span className="text-[#e5e7eb] text-xs font-medium text-center leading-tight">
                  {prodotto.nome}
                </span>
                <span className="text-[#f59e0b] text-sm font-bold">
                  €{prodotto.prezzo.toFixed(2)}
                </span>
              </button>
            ))}
          </div>
          {prodottiFiltrati.length === 0 && (
            <div className="flex items-center justify-center h-32">
              <p className="text-[#6b7280] text-sm">Nessun prodotto in questa categoria</p>
            </div>
          )}
        </div>
      </div>

      {/* Scontrino a destra */}
      <div className="p-2 pl-0 flex">
        <Scontrino />
      </div>

      {/* Modal attributi */}
      {prodottoModal && (
        <AttributiModal
          prodotto={prodottoModal}
          attributi={attributi}
          onConferma={(dati) => aggiungiAlScontrino(prodottoModal, dati)}
          onAnnulla={() => setProdottoModal(null)}
          titoloPulsante="Aggiungi"
        />
      )}
    </div>
  );
}
