import { useState } from 'react';
import { usePosStore } from '@/store/pos';

export function InventoryPage() {
  const [tab, setTab] = useState<'prodotti' | 'categorie' | 'attributi'>('prodotti');
  const { prodotti, categorie, attributi } = usePosStore();

  return (
    <section className="rounded-3xl border border-app-border bg-app-card p-4">
      <div className="mb-4 flex gap-2">
        {['prodotti', 'categorie', 'attributi'].map((item) => (
          <button key={item} onClick={() => setTab(item as typeof tab)} className={`min-h-11 rounded-2xl px-4 ${tab === item ? 'bg-app-primary' : 'border border-app-border'}`}>{item}</button>
        ))}
      </div>
      {tab === 'prodotti' && (
        <div className="space-y-3">
          {prodotti.map((p) => {
            const categoria = categorie.find((c) => c.id === p.categoria_id)?.nome ?? '—';
            const margine = p.prezzo > 0 ? ((p.prezzo - p.costo) / p.prezzo) * 100 : 0;
            return (
              <div key={p.id} className="grid gap-3 rounded-2xl border border-app-border p-4 lg:grid-cols-[1.2fr_1fr_120px_120px_120px]">
                <div><strong>{p.emoji} {p.nome}</strong><div className="text-sm text-app-muted">{categoria}</div></div>
                <div className="text-sm text-app-muted">Attributi: {p.attributi_ids.length || 'Nessuno'}</div>
                <div>Stock {p.stock}</div>
                <div>Costo € {p.costo.toFixed(2)}</div>
                <div>Margine {margine.toFixed(0)}%</div>
              </div>
            );
          })}
        </div>
      )}
      {tab === 'categorie' && (
        <div className="space-y-3">
          {categorie.map((c) => (
            <div key={c.id} className="rounded-2xl border border-app-border p-4">
              {c.emoji} <strong>{c.nome}</strong> · <span className="text-sm text-app-muted">{c.destinazione_stampa}</span>
            </div>
          ))}
        </div>
      )}
      {tab === 'attributi' && (
        <div className="space-y-3">
          {attributi.map((a) => (
            <div key={a.id} className="rounded-2xl border border-app-border p-4">
              <strong>{a.nome}</strong> · max {a.max_selezionabili}
              <div className="mt-2 text-sm text-app-muted">{a.valori.map((v) => `${v.valore} (€ ${v.prezzo_aggiunta.toFixed(2)})`).join(', ')}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
