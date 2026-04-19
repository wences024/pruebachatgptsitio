import { useMemo, useState } from 'react';
import { FullScreenModal } from '@/components/FullScreenModal';
import { ReceiptPanel } from '@/components/ReceiptPanel';
import { usePosStore } from '@/store/pos';

const statoColori = {
  libero: 'bg-slate-600',
  occupato: 'bg-app-primary',
  conto: 'bg-app-warning text-black'
};

export function TablesPage() {
  const sale = usePosStore((state) => state.sale);
  const tavoli = usePosStore((state) => state.tavoli);
  const righe = usePosStore((state) => state.righeCorrenti);
  const [salaAttiva, setSalaAttiva] = useState(sale[0]?.id);
  const [tavoloAttivo, setTavoloAttivo] = useState<string | null>(null);

  const tavoliSala = useMemo(() => tavoli.filter((t) => t.sala_id === salaAttiva), [salaAttiva, tavoli]);
  const tavolo = tavoli.find((item) => item.id === tavoloAttivo);
  const sala = sale.find((item) => item.id === tavolo?.sala_id);

  if (tavolo) {
    return (
      <div className="grid gap-4 xl:grid-cols-[1.2fr_260px]">
        <section className="rounded-3xl border border-app-border bg-app-card p-4">
          <button onClick={() => setTavoloAttivo(null)} className="mb-4 min-h-11 rounded-2xl border border-app-border px-4">← Indietro</button>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold">Tavolo {tavolo.numero} · {sala?.nome}</h1>
              <p className="text-sm text-app-muted">Aperto da 38 min</p>
            </div>
            <div className="flex gap-2">
              <button className="min-h-11 rounded-2xl bg-app-primary px-4 font-semibold">+ Prodotto</button>
              <button className="min-h-11 rounded-2xl border border-app-danger px-4 text-app-danger">Libera tavolo</button>
            </div>
          </div>
          <div className="space-y-3">
            {righe.map((riga) => (
              <div key={riga.id} className="flex items-center justify-between rounded-2xl border border-app-border p-4">
                <div>
                  <div className="font-medium">{riga.nome_prodotto}</div>
                  <div className="text-sm text-app-muted">{Object.entries(riga.attributi_selezionati).map(([k, v]) => `${k}: ${v.join(', ')}`).join(' · ') || 'Nessuna opzione'}</div>
                </div>
                <div className="text-right text-sm">
                  <div>{riga.quantita} × € {riga.prezzo_unitario.toFixed(2)}</div>
                  <div className="text-app-warning">€ {(riga.quantita * riga.prezzo_unitario).toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
        <ReceiptPanel />
      </div>
    );
  }

  return (
    <section className="rounded-3xl border border-app-border bg-app-card p-4">
      <div className="mb-4 flex flex-wrap gap-2">
        {sale.map((item) => (
          <button key={item.id} onClick={() => setSalaAttiva(item.id)} className={`min-h-11 rounded-full border px-4 ${salaAttiva === item.id ? 'border-app-primary bg-app-primary text-white' : 'border-app-border'}`}>
            {item.nome}
          </button>
        ))}
        <button className="min-h-11 rounded-full border border-dashed border-app-border px-4">+ Sala</button>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tavoliSala.map((tavolo) => (
          <button key={tavolo.id} onClick={() => setTavoloAttivo(tavolo.id)} className="rounded-3xl border border-app-border bg-app-bg p-5 text-left shadow-soft">
            <div className="text-2xl font-bold">Tavolo {tavolo.numero}</div>
            <div className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-medium ${statoColori[tavolo.stato]}`}>{tavolo.stato}</div>
            <div className="mt-3 text-sm text-app-muted">{tavolo.importo ? `Importo € ${tavolo.importo.toFixed(2)}` : 'Nessun ordine aperto'}</div>
          </button>
        ))}
      </div>
      <FullScreenModal open={false} title="Aggiungi prodotto" onClose={() => undefined}><div /></FullScreenModal>
    </section>
  );
}
