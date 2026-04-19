import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useToastStore } from '../store/useToastStore';
import {
  creaProdotto, aggiornaProdotto, aggiornaStock, eliminaProdotto,
  creaCategoria, aggiornaCategoria, eliminaCategoria,
  creaAttributo, aggiornaAttributo, eliminaAttributo,
  getProdotti, getCategorie, getAttributi,
} from '../lib/api';
import type { Prodotto, Categoria, Attributo, ValoreAttributo } from '../../../shared/types';
import Modal from '../components/Modal';

type Tab = 'prodotti' | 'categorie' | 'attributi';

export default function Magazzino() {
  const [tab, setTab] = useState<Tab>('prodotti');
  const prodotti = useAppStore(s => s.prodotti);
  const categorie = useAppStore(s => s.categorie);
  const attributi = useAppStore(s => s.attributi);
  const setProdotti = useAppStore(s => s.setProdotti);
  const setCategorie = useAppStore(s => s.setCategorie);
  const setAttributi = useAppStore(s => s.setAttributi);
  const toast = useToastStore(s => s.aggiungi);

  const ricarica = async () => {
    const [p, c, a] = await Promise.all([getProdotti(), getCategorie(), getAttributi()]);
    setProdotti(p); setCategorie(c); setAttributi(a);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Tab */}
      <div className="flex border-b border-[#374151] shrink-0">
        {(['prodotti', 'categorie', 'attributi'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-medium capitalize transition-colors border-b-2 ${
              tab === t
                ? 'border-[#4f46e5] text-[#4f46e5]'
                : 'border-transparent text-[#6b7280] active:text-[#e5e7eb]'
            }`}
          >{t}</button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === 'prodotti' && (
          <TabProdotti
            prodotti={prodotti}
            categorie={categorie}
            attributi={attributi}
            toast={toast}
            ricarica={ricarica}
          />
        )}
        {tab === 'categorie' && (
          <TabCategorie
            categorie={categorie}
            prodotti={prodotti}
            toast={toast}
            ricarica={ricarica}
          />
        )}
        {tab === 'attributi' && (
          <TabAttributi
            attributi={attributi}
            toast={toast}
            ricarica={ricarica}
          />
        )}
      </div>
    </div>
  );
}

// ===== TAB PRODOTTI =====
function TabProdotti({ prodotti, categorie, attributi, toast, ricarica }: {
  prodotti: Prodotto[]; categorie: Categoria[]; attributi: Attributo[];
  toast: (m: string, t?: 'successo' | 'errore' | 'info') => void;
  ricarica: () => void;
}) {
  const [modifica, setModifica] = useState<Prodotto | null>(null);
  const [showCrea, setShowCrea] = useState(false);
  const [stockEdit, setStockEdit] = useState<number>(0);
  const [form, setForm] = useState({ nome: '', emoji: '', categoria_id: '', prezzo: '', costo: '', stock: '', stock_minimo: '5', attributi_ids: [] as string[] });

  const handleSalvaStock = async () => {
    if (!modifica) return;
    try {
      await aggiornaStock(modifica.id, stockEdit);
      toast('Stock aggiornato');
      setModifica(null);
      ricarica();
    } catch { toast('Errore aggiornamento stock', 'errore'); }
  };

  const handleElimina = async () => {
    if (!modifica) return;
    if (!confirm(`Eliminare ${modifica.nome}?`)) return;
    try {
      await eliminaProdotto(modifica.id);
      toast('Prodotto eliminato');
      setModifica(null);
      ricarica();
    } catch { toast('Errore', 'errore'); }
  };

  const handleCrea = async () => {
    if (!form.nome || !form.prezzo) { toast('Nome e prezzo obbligatori', 'errore'); return; }
    try {
      await creaProdotto({
        ...form,
        prezzo: parseFloat(form.prezzo),
        costo: parseFloat(form.costo || '0'),
        stock: parseInt(form.stock || '0'),
        stock_minimo: parseInt(form.stock_minimo || '5'),
        categoria_id: form.categoria_id || null,
        attributi_ids: form.attributi_ids,
      });
      toast('Prodotto creato');
      setShowCrea(false);
      setForm({ nome: '', emoji: '', categoria_id: '', prezzo: '', costo: '', stock: '', stock_minimo: '5', attributi_ids: [] });
      ricarica();
    } catch { toast('Errore creazione', 'errore'); }
  };

  return (
    <div className="p-3">
      <div className="flex justify-between items-center mb-3">
        <p className="text-[#6b7280] text-sm">{prodotti.length} prodotti</p>
        <button onClick={() => setShowCrea(true)} className="btn-primary text-sm px-3 py-2">+ Prodotto</button>
      </div>

      <div className="space-y-1.5">
        {prodotti.map(p => {
          const margine = p.prezzo > 0 ? ((p.prezzo - p.costo) / p.prezzo * 100) : 0;
          const stockPerc = p.stock_minimo > 0 ? Math.min(p.stock / (p.stock_minimo * 3) * 100, 100) : 100;
          const stockBasso = p.stock <= p.stock_minimo;
          return (
            <button
              key={p.id}
              onClick={() => { setModifica(p); setStockEdit(p.stock); }}
              className="w-full bg-[#1f2937] border border-[#374151] rounded-xl p-3 flex items-center gap-3 text-left active:bg-[#374151]"
            >
              <span className="text-2xl w-8 text-center">{p.emoji ?? '🍽️'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[#e5e7eb] font-medium text-sm truncate">{p.nome}</p>
                  {stockBasso && <span className="text-[9px] bg-[#7f1d1d] text-[#fca5a5] px-1.5 py-0.5 rounded-full font-medium">⚠ Stock</span>}
                </div>
                <p className="text-[#6b7280] text-xs truncate">
                  {p.categoria?.nome ?? '—'} · Attr: {(p.attributi_ids?.length ?? 0)}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-[#374151] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${stockBasso ? 'bg-[#dc2626]' : 'bg-[#059669]'}`}
                      style={{ width: `${stockPerc}%` }}
                    />
                  </div>
                  <span className={`text-xs font-medium ${stockBasso ? 'text-[#f87171]' : 'text-[#6b7280]'}`}>{p.stock}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[#f59e0b] font-bold text-sm">€{p.prezzo.toFixed(2)}</p>
                <p className="text-[#6b7280] text-xs">Margine {margine.toFixed(0)}%</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Modal modifica stock */}
      {modifica && (
        <Modal titolo={`${modifica.emoji ?? ''} ${modifica.nome}`} onClose={() => setModifica(null)}>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Categoria', v: modifica.categoria?.nome ?? '—' },
                { label: 'Prezzo vendita', v: `€${modifica.prezzo.toFixed(2)}` },
                { label: 'Costo', v: `€${modifica.costo.toFixed(2)}` },
                { label: 'Margine', v: `${modifica.prezzo > 0 ? ((modifica.prezzo - modifica.costo) / modifica.prezzo * 100).toFixed(1) : 0}%` },
              ].map(item => (
                <div key={item.label} className="bg-[#111827] rounded-xl p-3">
                  <p className="text-[#6b7280] text-xs">{item.label}</p>
                  <p className="text-[#e5e7eb] font-semibold mt-0.5">{item.v}</p>
                </div>
              ))}
            </div>

            <div>
              <p className="label">Stock attuale</p>
              <div className="flex items-center gap-3">
                <button onClick={() => setStockEdit(s => Math.max(0, s - 1))}
                  className="w-11 h-11 bg-[#374151] rounded-xl text-xl flex items-center justify-center active:bg-[#4b5563]">−</button>
                <span className="text-[#e5e7eb] font-bold text-xl w-10 text-center">{stockEdit}</span>
                <button onClick={() => setStockEdit(s => s + 1)}
                  className="w-11 h-11 bg-[#374151] rounded-xl text-xl flex items-center justify-center active:bg-[#4b5563]">+</button>
                {[10, 24, 48].map(n => (
                  <button key={n} onClick={() => setStockEdit(s => s + n)}
                    className="px-3 h-9 bg-[#374151] rounded-lg text-sm text-[#6b7280] active:bg-[#4b5563]">+{n}</button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={handleElimina} className="btn-danger px-4">Elimina</button>
              <button onClick={() => setModifica(null)} className="btn-ghost flex-1">Annulla</button>
              <button onClick={handleSalvaStock} className="btn-primary flex-1">Salva</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal crea prodotto */}
      {showCrea && (
        <Modal titolo="+ Nuovo Prodotto" onClose={() => setShowCrea(false)}>
          <div className="p-5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="label">Nome *</label>
                <input className="input" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Es: Spritz" />
              </div>
              <div>
                <label className="label">Emoji</label>
                <input className="input" value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} placeholder="🍹" />
              </div>
              <div>
                <label className="label">Categoria</label>
                <select className="input" value={form.categoria_id} onChange={e => setForm(f => ({ ...f, categoria_id: e.target.value }))}>
                  <option value="">— Nessuna —</option>
                  {categorie.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Prezzo vendita *</label>
                <input className="input" type="number" step="0.10" value={form.prezzo} onChange={e => setForm(f => ({ ...f, prezzo: e.target.value }))} placeholder="0.00" />
              </div>
              <div>
                <label className="label">Costo</label>
                <input className="input" type="number" step="0.10" value={form.costo} onChange={e => setForm(f => ({ ...f, costo: e.target.value }))} placeholder="0.00" />
              </div>
              <div>
                <label className="label">Stock iniziale</label>
                <input className="input" type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} placeholder="0" />
              </div>
              <div>
                <label className="label">Stock minimo</label>
                <input className="input" type="number" value={form.stock_minimo} onChange={e => setForm(f => ({ ...f, stock_minimo: e.target.value }))} placeholder="5" />
              </div>
            </div>
            {attributi.length > 0 && (
              <div>
                <label className="label">Attributi</label>
                <div className="flex flex-wrap gap-2">
                  {attributi.map(a => (
                    <label key={a.id} className="flex items-center gap-2 px-3 py-2 bg-[#374151] rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.attributi_ids.includes(a.id)}
                        onChange={e => setForm(f => ({
                          ...f,
                          attributi_ids: e.target.checked
                            ? [...f.attributi_ids, a.id]
                            : f.attributi_ids.filter(x => x !== a.id),
                        }))}
                        className="accent-[#4f46e5]"
                      />
                      <span className="text-sm text-[#e5e7eb]">{a.nome}</span>
                      <span className="text-xs text-[#6b7280]">(max {a.max_selezionabili})</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowCrea(false)} className="btn-ghost flex-1">Annulla</button>
              <button onClick={handleCrea} className="btn-primary flex-1">Crea</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ===== TAB CATEGORIE =====
function TabCategorie({ categorie, prodotti, toast, ricarica }: {
  categorie: Categoria[]; prodotti: Prodotto[];
  toast: (m: string, t?: 'successo' | 'errore' | 'info') => void;
  ricarica: () => void;
}) {
  const [showCrea, setShowCrea] = useState(false);
  const [form, setForm] = useState({ nome: '', emoji: '', destinazione_stampa: 'bar' as Categoria['destinazione_stampa'] });

  const handleCrea = async () => {
    if (!form.nome) { toast('Nome obbligatorio', 'errore'); return; }
    try {
      await creaCategoria(form);
      toast('Categoria creata');
      setShowCrea(false);
      setForm({ nome: '', emoji: '', destinazione_stampa: 'bar' });
      ricarica();
    } catch { toast('Errore', 'errore'); }
  };

  const handleElimina = async (cat: Categoria) => {
    if (!confirm(`Eliminare la categoria "${cat.nome}"?`)) return;
    try {
      await eliminaCategoria(cat.id);
      toast('Categoria eliminata');
      ricarica();
    } catch { toast('Errore', 'errore'); }
  };

  const destLabel = { cucina: '🍳 Cucina', bar: '🍺 Bar', entrambe: '🍳+🍺 Entrambe' };

  return (
    <div className="p-3">
      <div className="flex justify-between items-center mb-3">
        <p className="text-[#6b7280] text-sm">{categorie.length} categorie</p>
        <button onClick={() => setShowCrea(true)} className="btn-primary text-sm px-3 py-2">+ Categoria</button>
      </div>
      <div className="space-y-1.5">
        {categorie.map(c => {
          const nProd = prodotti.filter(p => p.categoria_id === c.id).length;
          return (
            <div key={c.id} className="bg-[#1f2937] border border-[#374151] rounded-xl p-3 flex items-center gap-3">
              <span className="text-2xl">{c.emoji ?? '📂'}</span>
              <div className="flex-1">
                <p className="text-[#e5e7eb] font-medium">{c.nome}</p>
                <p className="text-[#6b7280] text-xs">{nProd} prodotti</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                c.destinazione_stampa === 'cucina' ? 'bg-[#7c2d12]/40 text-[#fb923c]' :
                c.destinazione_stampa === 'bar' ? 'bg-[#172554]/40 text-[#93c5fd]' :
                'bg-[#1e3a1e]/40 text-[#86efac]'
              }`}>
                {destLabel[c.destinazione_stampa]}
              </span>
              <button onClick={() => handleElimina(c)} className="text-[#6b7280] w-8 h-8 flex items-center justify-center active:text-[#dc2626]">🗑</button>
            </div>
          );
        })}
      </div>

      {showCrea && (
        <Modal titolo="+ Nuova Categoria" onClose={() => setShowCrea(false)}>
          <div className="p-5 space-y-4">
            <div>
              <label className="label">Nome *</label>
              <input className="input" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Es: Birre" />
            </div>
            <div>
              <label className="label">Emoji</label>
              <input className="input" value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} placeholder="🍺" />
            </div>
            <div>
              <label className="label">Destinazione stampa comanda</label>
              <div className="flex gap-2">
                {[
                  { v: 'cucina', label: '🍳 Cucina' },
                  { v: 'bar', label: '🍺 Bar' },
                  { v: 'entrambe', label: 'Entrambe' },
                ].map(opt => (
                  <button
                    key={opt.v}
                    onClick={() => setForm(f => ({ ...f, destinazione_stampa: opt.v as Categoria['destinazione_stampa'] }))}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium ${
                      form.destinazione_stampa === opt.v ? 'bg-[#4f46e5] text-white' : 'bg-[#374151] text-[#6b7280]'
                    }`}
                  >{opt.label}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowCrea(false)} className="btn-ghost flex-1">Annulla</button>
              <button onClick={handleCrea} className="btn-primary flex-1">Crea</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ===== TAB ATTRIBUTI =====
function TabAttributi({ attributi, toast, ricarica }: {
  attributi: Attributo[];
  toast: (m: string, t?: 'successo' | 'errore' | 'info') => void;
  ricarica: () => void;
}) {
  const [showCrea, setShowCrea] = useState(false);
  const [nomeAttr, setNomeAttr] = useState('');
  const [valoriTesto, setValoriTesto] = useState('');
  const [prezziTesto, setPrezziTesto] = useState('');
  const [maxSel, setMaxSel] = useState(1);

  const handleCrea = async () => {
    if (!nomeAttr || !valoriTesto) { toast('Nome e valori obbligatori', 'errore'); return; }
    const valoriArr = valoriTesto.split(',').map(v => v.trim()).filter(Boolean);
    const prezziArr = prezziTesto.split(',').map(v => parseFloat(v.trim()) || 0);
    const valori: ValoreAttributo[] = valoriArr.map((v, i) => ({
      valore: v,
      prezzo_aggiunta: prezziArr[i] ?? 0,
    }));
    try {
      await creaAttributo({ nome: nomeAttr, valori, max_selezionabili: maxSel });
      toast('Attributo creato');
      setShowCrea(false);
      setNomeAttr(''); setValoriTesto(''); setPrezziTesto(''); setMaxSel(1);
      ricarica();
    } catch { toast('Errore', 'errore'); }
  };

  const handleElimina = async (a: Attributo) => {
    if (!confirm(`Eliminare l'attributo "${a.nome}"?`)) return;
    try {
      await eliminaAttributo(a.id);
      toast('Attributo eliminato');
      ricarica();
    } catch { toast('Errore', 'errore'); }
  };

  return (
    <div className="p-3">
      <div className="flex justify-between items-center mb-3">
        <p className="text-[#6b7280] text-sm">{attributi.length} attributi</p>
        <button onClick={() => setShowCrea(true)} className="btn-primary text-sm px-3 py-2">+ Attributo</button>
      </div>
      <div className="space-y-1.5">
        {attributi.map(a => (
          <div key={a.id} className="bg-[#1f2937] border border-[#374151] rounded-xl p-3 flex items-center gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-[#e5e7eb] font-medium">{a.nome}</p>
                <span className="text-xs bg-[#374151] text-[#6b7280] px-2 py-0.5 rounded-full">max {a.max_selezionabili}</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {a.valori.map(v => (
                  <span key={v.valore} className="text-xs bg-[#111827] text-[#e5e7eb] px-2 py-0.5 rounded">
                    {v.valore}{v.prezzo_aggiunta > 0 ? ` +€${v.prezzo_aggiunta.toFixed(2)}` : ''}
                  </span>
                ))}
              </div>
            </div>
            <button onClick={() => handleElimina(a)} className="text-[#6b7280] w-8 h-8 flex items-center justify-center active:text-[#dc2626]">🗑</button>
          </div>
        ))}
      </div>

      {showCrea && (
        <Modal titolo="+ Nuovo Attributo" onClose={() => setShowCrea(false)}>
          <div className="p-5 space-y-4">
            <div>
              <label className="label">Nome *</label>
              <input className="input" value={nomeAttr} onChange={e => setNomeAttr(e.target.value)} placeholder="Es: Formato" />
            </div>
            <div>
              <label className="label">Valori (separati da virgola) *</label>
              <input className="input" value={valoriTesto} onChange={e => setValoriTesto(e.target.value)} placeholder="33cl, 66cl, Pinta" />
            </div>
            <div>
              <label className="label">Differenza prezzo per valore (separati da virgola)</label>
              <input className="input" value={prezziTesto} onChange={e => setPrezziTesto(e.target.value)} placeholder="0, 2.50, 4.50" />
            </div>
            <div>
              <label className="label">Massimo selezionabile</label>
              <div className="flex items-center gap-3">
                <button onClick={() => setMaxSel(n => Math.max(1, n - 1))}
                  className="w-10 h-10 bg-[#374151] rounded-lg text-lg flex items-center justify-center active:bg-[#4b5563]">−</button>
                <span className="text-[#e5e7eb] font-bold w-6 text-center">{maxSel}</span>
                <button onClick={() => setMaxSel(n => n + 1)}
                  className="w-10 h-10 bg-[#374151] rounded-lg text-lg flex items-center justify-center active:bg-[#4b5563]">+</button>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowCrea(false)} className="btn-ghost flex-1">Annulla</button>
              <button onClick={handleCrea} className="btn-primary flex-1">Crea</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
