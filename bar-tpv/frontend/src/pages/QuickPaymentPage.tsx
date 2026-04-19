import { useMemo, useState } from 'react';
import type { Prodotto } from '@bar-tpv/shared';
import { FullScreenModal } from '@/components/FullScreenModal';
import { ProductGrid } from '@/components/ProductGrid';
import { ReceiptPanel } from '@/components/ReceiptPanel';
import { usePosStore } from '@/store/pos';

export function QuickPaymentPage() {
  const categorie = usePosStore((state) => state.categorie);
  const prodotti = usePosStore((state) => state.prodotti);
  const [categoriaAttiva, setCategoriaAttiva] = useState<string>('tutte');
  const [prodottoSelezionato, setProdottoSelezionato] = useState<Prodotto | null>(null);

  const lista = useMemo(
    () => categoriaAttiva === 'tutte' ? prodotti : prodotti.filter((p) => p.categoria_id === categoriaAttiva),
    [categoriaAttiva, prodotti]
  );

  return (
    <div className="flex flex-col gap-4 xl:flex-row">
      <section className="flex-1 rounded-3xl border border-app-border bg-app-card p-4">
        <div className="mb-4 flex flex-wrap gap-2">
          <button onClick={() => setCategoriaAttiva('tutte')} className="min-h-11 rounded-full border border-app-border px-4">Tutte</button>
          {categorie.map((cat) => (
            <button key={cat.id} onClick={() => setCategoriaAttiva(cat.id)} className="min-h-11 rounded-full border border-app-border px-4">
              {cat.emoji} {cat.nome}
            </button>
          ))}
        </div>
        <ProductGrid prodotti={lista} onSelect={setProdottoSelezionato} />
      </section>
      <ReceiptPanel />
      <FullScreenModal open={Boolean(prodottoSelezionato)} title={prodottoSelezionato?.nome ?? 'Selezione attributi'} onClose={() => setProdottoSelezionato(null)}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm">
            <span>Quantità</span>
            <input type="number" defaultValue={1} className="mt-2 min-h-11 w-full rounded-2xl border border-app-border bg-app-input px-4" />
          </label>
          <label className="block text-sm">
            <span>Prezzo unitario</span>
            <input type="number" defaultValue={prodottoSelezionato?.prezzo ?? 0} className="mt-2 min-h-11 w-full rounded-2xl border border-app-border bg-app-input px-4" />
          </label>
          <label className="block text-sm md:col-span-2">
            <span>Nota</span>
            <textarea className="mt-2 min-h-28 w-full rounded-2xl border border-app-border bg-app-input px-4 py-3" placeholder="Senza ghiaccio, poco sale, ecc." />
          </label>
        </div>
        <div className="mt-6 flex gap-3">
          <button onClick={() => setProdottoSelezionato(null)} className="min-h-11 rounded-2xl border border-app-border px-5">Annulla</button>
          <button onClick={() => setProdottoSelezionato(null)} className="min-h-11 rounded-2xl bg-app-primary px-5 font-semibold">Aggiungi</button>
        </div>
      </FullScreenModal>
    </div>
  );
}
