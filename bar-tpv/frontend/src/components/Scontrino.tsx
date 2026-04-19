import { useState } from 'react';
import { useScontrinoStore } from '../store/useScontrinoStore';
import { useAppStore } from '../store/useAppStore';
import { useToastStore } from '../store/useToastStore';
import { aggiungiRiga, modificaRiga, eliminaRiga } from '../lib/api';
import { v4 as uuidv4 } from 'uuid';
import AttributiModal from './modals/AttributiModal';
import PannelloIncasso from './PannelloIncasso';
import type { Prodotto } from '../../../shared/types';

export default function Scontrino() {
  const { righe, ordine_id, aggiornaRiga, rimuoviRiga, toggleSelezione, svuota, setRighe } = useScontrinoStore();
  const attributi = useAppStore(s => s.attributi);
  const prodotti = useAppStore(s => s.prodotti);
  const toast = useToastStore(s => s.aggiungi);
  const [modificaId, setModificaId] = useState<string | null>(null);

  const rigaInModifica = modificaId ? righe.find(r => r.id === modificaId) : null;
  const prodottoInModifica = rigaInModifica
    ? prodotti.find(p => p.id === rigaInModifica.prodotto_id)
    : null;

  const handleEliminaRiga = async (id: string) => {
    if (ordine_id) {
      try { await eliminaRiga(ordine_id, id); } catch { /* già gestito localmente */ }
    }
    rimuoviRiga(id);
  };

  const handleModificaConferma = async (dati: {
    quantita: number;
    prezzo_unitario: number;
    attributi_selezionati: Record<string, string[]>;
    nota: string;
  }) => {
    if (!modificaId) return;
    aggiornaRiga(modificaId, dati);
    if (ordine_id) {
      try { await modificaRiga(ordine_id, modificaId, dati); } catch { /* non critico */ }
    }
    toast('Prodotto aggiornato');
    setModificaId(null);
  };

  const handlePagato = () => {
    svuota();
    toast('✓ Ordine completato');
  };

  if (righe.length === 0) {
    return (
      <div className="w-[200px] shrink-0 flex flex-col gap-3">
        <div className="bg-[#1f2937] rounded-xl border border-[#374151] p-4 flex-1 flex items-center justify-center">
          <p className="text-[#6b7280] text-sm text-center">Scontrino vuoto</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-[200px] shrink-0 flex flex-col gap-3 overflow-hidden">
        {/* Lista righe */}
        <div className="bg-[#1f2937] rounded-xl border border-[#374151] overflow-y-auto flex-1">
          <div className="p-2 space-y-1">
            {righe.map(r => (
              <div
                key={r.id}
                className={`flex items-start gap-1.5 p-1.5 rounded-lg ${
                  r.selezionata ? 'bg-[#1e1b4b]/60' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={r.selezionata}
                  onChange={() => toggleSelezione(r.id)}
                  className="mt-0.5 w-4 h-4 accent-[#4f46e5] shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => setModificaId(r.id)}
                    className="text-left w-full"
                  >
                    <p className="text-[#e5e7eb] text-xs font-medium leading-tight truncate">
                      {r.quantita > 1 && (
                        <span className="text-[#f59e0b] font-bold">{r.quantita}× </span>
                      )}
                      {r.nome_prodotto}
                    </p>
                    {Object.keys(r.attributi_selezionati).length > 0 && (
                      <p className="text-[#6b7280] text-[10px] truncate">
                        {Object.values(r.attributi_selezionati).flat().join(', ')}
                      </p>
                    )}
                    {r.nota && (
                      <p className="text-[#6b7280] text-[10px] truncate italic">{r.nota}</p>
                    )}
                  </button>
                  <p className="text-[#f59e0b] text-xs font-semibold">
                    € {(r.quantita * r.prezzo_unitario).toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={() => handleEliminaRiga(r.id)}
                  className="text-[#6b7280] text-xs w-6 h-6 flex items-center justify-center rounded active:bg-[#374151] shrink-0"
                >✕</button>
              </div>
            ))}
          </div>
        </div>

        {/* Pannello incasso */}
        <PannelloIncasso
          ordine_id={ordine_id}
          righe={righe}
          onPagato={handlePagato}
        />
      </div>

      {/* Modal modifica */}
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
          onElimina={() => {
            handleEliminaRiga(rigaInModifica.id);
            setModificaId(null);
          }}
          onConferma={handleModificaConferma}
          onAnnulla={() => setModificaId(null)}
        />
      )}
    </>
  );
}

// Funzione helper esportata per aggiungere al scontrino (usata da PagamentoRapido)
export function useScontrinoActions() {
  const store = useScontrinoStore();
  const attributi = useAppStore(s => s.attributi);
  const toast = useToastStore(s => s.aggiungi);

  const aggiungiProdotto = async (
    prodotto: Prodotto,
    dati: { quantita: number; prezzo_unitario: number; attributi_selezionati: Record<string, string[]>; nota: string }
  ) => {
    const id = uuidv4();
    store.aggiungiRiga({
      id,
      prodotto_id: prodotto.id,
      nome_prodotto: prodotto.nome,
      ...dati,
    });

    if (store.ordine_id) {
      try {
        const riga = await aggiungiRiga(store.ordine_id, {
          prodotto_id: prodotto.id,
          ...dati,
        });
        // Aggiorna l'id con quello del server
        store.aggiornaRiga(id, { id: riga.id });
      } catch {
        toast('Errore sincronizzazione con server', 'errore');
      }
    }
  };

  return { aggiungiProdotto, attributi };
}
