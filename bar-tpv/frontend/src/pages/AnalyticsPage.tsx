import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

const data = [
  { nome: 'Lun', vendite: 840 },
  { nome: 'Mar', vendite: 920 },
  { nome: 'Mer', vendite: 760 },
  { nome: 'Gio', vendite: 1100 },
  { nome: 'Ven', vendite: 1480 },
  { nome: 'Sab', vendite: 1740 },
  { nome: 'Dom', vendite: 1320 }
];

export function AnalyticsPage() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ['Oggi', '€ 1.280'],
          ['Settimana', '€ 8.160'],
          ['Mese', '€ 31.220'],
          ['Anno', '€ 184.900']
        ].map(([titolo, valore]) => (
          <div key={titolo} className="rounded-3xl border border-app-border bg-app-card p-4">
            <div className="text-sm text-app-muted">{titolo}</div>
            <div className="mt-2 text-2xl font-bold">{valore}</div>
          </div>
        ))}
      </div>
      <section className="rounded-3xl border border-app-border bg-app-card p-4">
        <h2 className="mb-4 text-lg font-semibold">Vendite ultimi 7 giorni</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="nome" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Bar dataKey="vendite" fill="#4f46e5" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
