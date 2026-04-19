import { useState } from 'react';
import type { Prodotto, Attributo, AttributiSelezionati } from '../../../../shared/types';
import Modal from '../Modal';

interface Props {
  prodotto: Prodotto;
  attributi: Attributo[];
  onConferma: (dati: {
    quantita: number;
    prezzo_unitario: number;
    attributi_selezionati: AttributiSelezionati;
    nota: string;
  }) => void;
  onAnnulla: () => void;
  titoloPulsante?: string;
  // Per modifica: valori iniziali
  quantitaIniziale?: number;
  prezzoIniziale?: number;
  attributiIniziali?: AttributiSelezionati;
  notaIniziale?: string;
  mostraElimina?: boolean;
  onElimina?: () => void;
}

export default function AttributiModal({
  prodotto, attributi, onConferma, onAnnulla,
  titoloPulsante = 'Aggiungi',
  quantitaIniziale = 1, prezzoIniziale, attributiIniziali = {}, notaIniziale = '',
  mostraElimina, onElimina,
}: Props) {
  const attributiProdotto = (prodotto.attributi_ids || [])
    .map(id => attributi.find(a => a.id === id))
    .filter(Boolean) as Attributo[];

  const prezzoBase = prezzoIniziale ?? prodotto.prezzo;

  const [selezioni, setSelezioni] = useState<AttributiSelezionati>(attributiIniziali);
  const [quantita, setQuantita] = useState(quantitaIniziale);
  const [nota, setNota] = useState(notaIniziale);
  const [prezzoCustom, setPrezzoCustom] = useState<string>('');

  const prezzoAggiunta = attributiProdotto.reduce((sum, attr) => {
    const selezionati = selezioni[attr.id] || [];
    return sum + selezionati.reduce((s, v) => {
      const val = attr.valori.find(x => x.valore === v);
      return s + (val?.prezzo_aggiunta ?? 0);
    }, 0);
  }, 0);

  const prezzoUnitario = prezzoCustom !== ''
    ? parseFloat(prezzoCustom) || 0
    : prezzoBase + prezzoAggiunta;

  const toggleValore = (attr: Attributo, valore: string) => {
    setSelezioni(prev => {
      const correnti = prev[attr.id] || [];
      if (correnti.includes(valore)) {
        return { ...prev, [attr.id]: correnti.filter(v => v !== valore) };
      }
      if (attr.max_selezionabili === 1) {
        return { ...prev, [attr.id]: [valore] };
      }
      if (correnti.length < attr.max_selezionabili) {
        return { ...prev, [attr.id]: [...correnti, valore] };
      }
      return prev;
    });
    setPrezzoCustom(''); // reset prezzo custom quando cambiano le selezioni
  };

  const handleConferma = () => {
    onConferma({
      quantita,
      prezzo_unitario: prezzoUnitario,
      attributi_selezionati: selezioni,
      nota,
    });
  };

  return (
    <Modal titolo={`${prodotto.emoji ?? ''} ${prodotto.nome}`} onClose={onAnnulla}>
      <div className="p-4 space-y-4">
        {/* Attributi */}
        {attributiProdotto.map(attr => (
          <div key={attr.id}>
            <p className="label">
              {attr.nome}
              {attr.max_selezionabili > 1 && (
                <span className="text-[#6b7280] font-normal"> (max {attr.max_selezionabili})</span>
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              {attr.valori.map(v => {
                const sel = (selezioni[attr.id] || []).includes(v.valore);
                return (
                  <button
                    key={v.valore}
                    onClick={() => toggleValore(attr, v.valore)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[40px] ${
                      sel
                        ? 'bg-[#4f46e5] text-white'
                        : 'bg-[#374151] text-[#e5e7eb] active:bg-[#4b5563]'
                    }`}
                  >
                    {v.valore}
                    {v.prezzo_aggiunta > 0 && (
                      <span className="ml-1 text-xs opacity-75">+€{v.prezzo_aggiunta.toFixed(2)}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Quantità */}
        <div>
          <p className="label">Quantità</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantita(q => Math.max(1, q - 1))}
              className="w-11 h-11 bg-[#374151] rounded-xl text-xl flex items-center justify-center active:bg-[#4b5563]"
            >−</button>
            <span className="text-[#e5e7eb] font-bold text-xl w-8 text-center">{quantita}</span>
            <button
              onClick={() => setQuantita(q => q + 1)}
              className="w-11 h-11 bg-[#374151] rounded-xl text-xl flex items-center justify-center active:bg-[#4b5563]"
            >+</button>
          </div>
        </div>

        {/* Prezzo unitario */}
        <div>
          <p className="label">Prezzo unitario (€)</p>
          <input
            type="number"
            className="input w-36"
            step="0.10"
            min="0"
            value={prezzoCustom !== '' ? prezzoCustom : prezzoUnitario.toFixed(2)}
            onChange={e => setPrezzoCustom(e.target.value)}
            onFocus={() => setPrezzoCustom(prezzoUnitario.toFixed(2))}
          />
        </div>

        {/* Nota */}
        <div>
          <p className="label">Nota (opzionale)</p>
          <input
            type="text"
            className="input"
            placeholder="Es: senza cipolla, ben cotto..."
            value={nota}
            onChange={e => setNota(e.target.value)}
          />
        </div>

        {/* Totale */}
        <div className="flex justify-between items-center py-2 border-t border-[#374151]">
          <span className="text-[#6b7280] text-sm">Totale</span>
          <span className="text-[#f59e0b] font-bold text-xl">
            € {(prezzoUnitario * quantita).toFixed(2)}
          </span>
        </div>

        {/* Pulsanti */}
        <div className="flex gap-3">
          {mostraElimina && (
            <button onClick={onElimina} className="btn-danger px-3">🗑</button>
          )}
          <button onClick={onAnnulla} className="btn-ghost flex-1">Annulla</button>
          <button onClick={handleConferma} className="btn-primary flex-1">
            {titoloPulsante}
          </button>
        </div>
      </div>
    </Modal>
  );
}
