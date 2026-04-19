import type { Prodotto } from '@bar-tpv/shared';

export function ProductGrid({ prodotti, onSelect }: { prodotti: Prodotto[]; onSelect: (prodotto: Prodotto) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {prodotti.map((prodotto) => (
        <button
          key={prodotto.id}
          onClick={() => onSelect(prodotto)}
          className="min-h-[120px] rounded-3xl border border-app-border bg-app-card p-4 text-left shadow-soft"
        >
          <div className="text-3xl">{prodotto.emoji ?? '🍽️'}</div>
          <div className="mt-3 font-semibold">{prodotto.nome}</div>
          <div className="text-sm text-app-muted">€ {prodotto.prezzo.toFixed(2)}</div>
          {prodotto.attributi_ids.length > 0 && (
            <span className="mt-3 inline-flex rounded-full bg-app-primary/20 px-3 py-1 text-xs text-indigo-200">★ opzioni</span>
          )}
        </button>
      ))}
    </div>
  );
}
