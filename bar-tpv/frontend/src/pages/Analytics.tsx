import { useState, useEffect } from 'react';
import { useToastStore } from '../store/useToastStore';
import {
  getDashboard, getVenditeGiornaliere, getProdottiVenduti,
  getCategorieStat, getMetodiPagamento,
} from '../lib/api';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const COLORS = ['#4f46e5', '#059669', '#f59e0b', '#dc2626', '#06b6d4', '#8b5cf6'];

interface DashData {
  oggi: { totale: number; num_transazioni: number; contanti: number; carta: number; satispay: number };
  settimana: { totale: number; num_transazioni: number };
  mese: { totale: number; num_transazioni: number };
  anno: { totale: number; num_transazioni: number };
}

export default function Analytics() {
  const toast = useToastStore(s => s.aggiungi);
  const [dashboard, setDashboard] = useState<DashData | null>(null);
  const [venditeGiornaliere, setVenditeGiornaliere] = useState<{ data: string; totale: number }[]>([]);
  const [prodottiVenduti, setProdottiVenduti] = useState<{ nome: string; quantita_totale: number; ricavo_totale: number; margine_percentuale: number }[]>([]);
  const [categorie, setCategorie] = useState<{ nome: string; emoji: string; ricavo_totale: number; num_vendite: number }[]>([]);
  const [metodi, setMetodi] = useState<{ metodo: string; totale: number; num_transazioni: number }[]>([]);
  const [da, setDa] = useState(new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]);
  const [a, setA] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const carica = async () => {
      try {
        const [d, v, p, c, m] = await Promise.all([
          getDashboard(),
          getVenditeGiornaliere(da, a),
          getProdottiVenduti(da, a),
          getCategorieStat(da, a),
          getMetodiPagamento(da, a),
        ]);
        setDashboard(d);
        setVenditeGiornaliere(v.map((x: { data: string; totale: string }) => ({
          data: new Date(x.data).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }),
          totale: parseFloat(x.totale),
        })));
        setProdottiVenduti(p);
        setCategorie(c);
        setMetodi(m);
      } catch {
        toast('Errore caricamento analytics', 'errore');
      }
    };
    carica();
  }, [da, a, toast]);

  const metodiPieData = metodi.map(m => ({
    name: m.metodo === 'contanti' ? 'Contanti' : m.metodo === 'carta' ? 'Carta' : 'Satispay',
    value: parseFloat(String(m.totale)),
  }));

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      <h1 className="text-[#e5e7eb] text-xl font-bold">📊 Analytics</h1>

      {/* Filtro periodo */}
      <div className="flex items-center gap-3 flex-wrap">
        <div>
          <label className="label">Dal</label>
          <input type="date" className="input w-auto" value={da} onChange={e => setDa(e.target.value)} />
        </div>
        <div>
          <label className="label">Al</label>
          <input type="date" className="input w-auto" value={a} onChange={e => setA(e.target.value)} />
        </div>
        {[
          { label: 'Oggi', giorni: 0 },
          { label: '7gg', giorni: 7 },
          { label: '30gg', giorni: 30 },
          { label: 'Anno', giorni: 365 },
        ].map(opt => (
          <button
            key={opt.label}
            onClick={() => {
              setDa(new Date(Date.now() - opt.giorni * 86400000).toISOString().split('T')[0]);
              setA(new Date().toISOString().split('T')[0]);
            }}
            className="btn-ghost text-sm px-3 py-2 self-end"
          >{opt.label}</button>
        ))}
      </div>

      {/* KPI cards */}
      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Oggi', totale: dashboard.oggi.totale, sub: `${dashboard.oggi.num_transazioni} transazioni` },
            { label: 'Settimana', totale: dashboard.settimana.totale, sub: `${dashboard.settimana.num_transazioni} transazioni` },
            { label: 'Mese', totale: dashboard.mese.totale, sub: `${dashboard.mese.num_transazioni} transazioni` },
            { label: 'Anno', totale: dashboard.anno.totale, sub: `${dashboard.anno.num_transazioni} transazioni` },
          ].map(kpi => (
            <div key={kpi.label} className="bg-[#1f2937] border border-[#374151] rounded-xl p-4">
              <p className="text-[#6b7280] text-xs">{kpi.label}</p>
              <p className="text-[#f59e0b] text-2xl font-bold mt-1">€{Number(kpi.totale).toFixed(0)}</p>
              <p className="text-[#6b7280] text-xs mt-0.5">{kpi.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Grafici */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Vendite per giorno */}
        <div className="bg-[#1f2937] border border-[#374151] rounded-xl p-4">
          <h2 className="text-[#e5e7eb] font-semibold mb-4">Vendite per Giorno</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={venditeGiornaliere}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="data" tick={{ fill: '#6b7280', fontSize: 11 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={v => `€${v}`} />
              <Tooltip
                contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
                labelStyle={{ color: '#e5e7eb' }}
                formatter={(v: number) => [`€${v.toFixed(2)}`, 'Vendite']}
              />
              <Line type="monotone" dataKey="totale" stroke="#4f46e5" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Metodi pagamento */}
        <div className="bg-[#1f2937] border border-[#374151] rounded-xl p-4">
          <h2 className="text-[#e5e7eb] font-semibold mb-4">Metodi di Pagamento</h2>
          {metodiPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={metodiPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {metodiPieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => `€${v.toFixed(2)}`} contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <p className="text-[#6b7280] text-sm">Nessun dato nel periodo</p>
            </div>
          )}
        </div>

        {/* Categorie */}
        <div className="bg-[#1f2937] border border-[#374151] rounded-xl p-4">
          <h2 className="text-[#e5e7eb] font-semibold mb-4">Ricavo per Categoria</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={categorie.slice(0, 8).map(c => ({ nome: `${c.emoji} ${c.nome}`, ricavo: parseFloat(String(c.ricavo_totale)) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="nome" tick={{ fill: '#6b7280', fontSize: 10 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={v => `€${v}`} />
              <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }} formatter={(v: number) => [`€${v.toFixed(2)}`, 'Ricavo']} />
              <Bar dataKey="ricavo" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Prodotti più venduti */}
        <div className="bg-[#1f2937] border border-[#374151] rounded-xl p-4">
          <h2 className="text-[#e5e7eb] font-semibold mb-3">Top Prodotti</h2>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {prodottiVenduti.slice(0, 10).map((p, i) => (
              <div key={p.nome} className="flex items-center gap-3">
                <span className="text-[#6b7280] text-xs w-5 text-right">{i + 1}.</span>
                <span className="flex-1 text-[#e5e7eb] text-sm truncate">{p.nome}</span>
                <span className="text-[#6b7280] text-xs">{p.quantita_totale} pz</span>
                <span className="text-[#f59e0b] text-sm font-semibold">€{Number(p.ricavo_totale).toFixed(0)}</span>
                <span className={`text-xs ${Number(p.margine_percentuale) > 50 ? 'text-[#34d399]' : 'text-[#fb923c]'}`}>
                  {Number(p.margine_percentuale).toFixed(0)}%
                </span>
              </div>
            ))}
            {prodottiVenduti.length === 0 && (
              <p className="text-[#6b7280] text-sm text-center py-4">Nessuna vendita nel periodo</p>
            )}
          </div>
        </div>
      </div>

      {/* Dettaglio metodi pagamento oggi */}
      {dashboard && (
        <div className="bg-[#1f2937] border border-[#374151] rounded-xl p-4">
          <h2 className="text-[#e5e7eb] font-semibold mb-3">Incassi Oggi per Metodo</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: '💵 Contanti', valore: dashboard.oggi.contanti, color: 'text-[#34d399]' },
              { label: '💳 Carta', valore: dashboard.oggi.carta, color: 'text-[#60a5fa]' },
              { label: '📱 Satispay', valore: dashboard.oggi.satispay, color: 'text-[#a78bfa]' },
            ].map(item => (
              <div key={item.label} className="bg-[#111827] rounded-xl p-3 text-center">
                <p className="text-[#6b7280] text-xs">{item.label}</p>
                <p className={`text-2xl font-bold mt-1 ${item.color}`}>€{Number(item.valore).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
