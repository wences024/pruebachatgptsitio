const stampanti = [
  { nome: 'Epson FP-81', endpoint: '192.168.1.10:9100', stato: 'Online', tipo: 'Fiscale' },
  { nome: 'Stampante Cucina', endpoint: '192.168.1.11:9100', stato: 'Offline', tipo: 'Comanda cucina' },
  { nome: 'Stampante Bar', endpoint: '192.168.1.12:9100', stato: 'Online', tipo: 'Comanda bar' }
];

const utenti = [
  { nome: 'Teresa', ruolo: 'admin', stato: 'attivo' },
  { nome: 'Marco', ruolo: 'cassiere', stato: 'attivo' },
  { nome: 'Giulia', ruolo: 'cameriere', stato: 'attivo' }
];

export function SettingsPage() {
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <section className="rounded-3xl border border-app-border bg-app-card p-4 xl:col-span-2">
        <h2 className="text-lg font-semibold">Stampanti</h2>
        <div className="mt-4 space-y-3">
          {stampanti.map((stampante) => (
            <div key={stampante.nome} className="rounded-2xl border border-app-border p-4">
              <strong>{stampante.nome}</strong>
              <div className="text-sm text-app-muted">{stampante.endpoint} · {stampante.tipo}</div>
              <div className={stampante.stato === 'Online' ? 'text-app-success' : 'text-app-danger'}>● {stampante.stato}</div>
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-3xl border border-app-border bg-app-card p-4">
        <h2 className="text-lg font-semibold">Pagamenti</h2>
        <div className="mt-4 rounded-2xl border border-app-border p-4">
          <div className="font-medium">Satispay</div>
          <div className="text-sm text-app-muted">ID negozio: demo-merchant-001</div>
          <div className="mt-2 text-app-success">● Connesso</div>
        </div>
        <h2 className="mt-6 text-lg font-semibold">Utenti</h2>
        <div className="mt-4 space-y-3">
          {utenti.map((utente) => (
            <div key={utente.nome} className="rounded-2xl border border-app-border p-4">
              <strong>{utente.nome}</strong>
              <div className="text-sm text-app-muted">{utente.ruolo} · {utente.stato}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
