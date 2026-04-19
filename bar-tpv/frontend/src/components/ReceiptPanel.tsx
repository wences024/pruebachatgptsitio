import { useMemo } from 'react';
import { usePosStore } from '@/store/pos';

export function ReceiptPanel() {
  const righe = usePosStore((state) => state.righeCorrenti);
  const toggleRiga = usePosStore((state) => state.toggleRiga);

  const totale = useMemo(() => righe.reduce((sum, r) => sum + r.quantita * r.prezzo_unitario, 0), [righe]);
  const totaleSelezione = useMemo(() => righe.filter((r) => r.selezionata).reduce((sum, r) => sum + r.quantita * r.prezzo_unitario, 0), [righe]);

  return (
    <aside className="w-full rounded-3xl border border-app-border bg-app-card p-4 xl:w-[185px] xl:min-w-[185px]">
      <h3 className="text-base font-semibold">Scontrino</h3>
      <div className="mt-4 space-y-3">
        {righe.map((riga) => (
          <div key={riga.id} className="rounded-2xl border border-app-border p-3 text-sm">
            <label className="flex items-start gap-2">
              <input type="checkbox" checked={riga.selezionata} onChange={() => toggleRiga(riga.id)} />
              <div className="min-w-0 flex-1">
                <button className="block truncate font-medium">{riga.nome_prodotto}</button>
                <div className="text-app-muted">{riga.quantita} × € {riga.prezzo_unitario.toFixed(2)}</div>
              </div>
              <div>€ {(riga.quantita * riga.prezzo_unitario).toFixed(2)}</div>
            </label>
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-2 border-t border-app-border pt-4 text-sm">
        <div className="flex justify-between"><span>Totale</span><strong>€ {totale.toFixed(2)}</strong></div>
        <div className="flex justify-between text-app-warning"><span>Selezione</span><strong>€ {totaleSelezione.toFixed(2)}</strong></div>
      </div>
      <button className="mt-4 min-h-11 w-full rounded-2xl bg-app-primary font-semibold">🖨 Stampa comanda</button>
      <div className="mt-4 space-y-2">
        <button className="min-h-11 w-full rounded-2xl bg-app-success font-semibold">💵 Contanti</button>
        <button className="min-h-11 w-full rounded-2xl border border-app-border bg-app-bg font-semibold">💳 Carta</button>
        <button className="min-h-11 w-full rounded-2xl border border-app-border bg-app-bg font-semibold">📱 Satispay</button>
      </div>
    </aside>
  );
}
