import { useState, useEffect } from 'react';
import { useToastStore } from '../store/useToastStore';
import {
  getStampanti, creaStampante, aggiornaStampante, eliminaStampante, testStampante,
  getUtenti, creaUtente, aggiornaUtente,
  getStatoSatispay,
} from '../lib/api';
import type { Stampante, Utente } from '../../../shared/types';
import Modal from '../components/Modal';

type Sezione = 'stampanti' | 'pagamenti' | 'utenti';

export default function Impostazioni() {
  const [sezione, setSezione] = useState<Sezione>('stampanti');

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex border-b border-[#374151] shrink-0">
        {(['stampanti', 'pagamenti', 'utenti'] as Sezione[]).map(s => (
          <button
            key={s}
            onClick={() => setSezione(s)}
            className={`flex-1 py-3 text-sm font-medium capitalize transition-colors border-b-2 ${
              sezione === s
                ? 'border-[#4f46e5] text-[#4f46e5]'
                : 'border-transparent text-[#6b7280] active:text-[#e5e7eb]'
            }`}
          >{s}</button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">
        {sezione === 'stampanti' && <SezioneStampanti />}
        {sezione === 'pagamenti' && <SezionePagamenti />}
        {sezione === 'utenti' && <SezioneUtenti />}
      </div>
    </div>
  );
}

// ===== STAMPANTI =====
function SezioneStampanti() {
  const toast = useToastStore(s => s.aggiungi);
  const [stampanti, setStampanti] = useState<Stampante[]>([]);
  const [modifica, setModifica] = useState<Stampante | null>(null);
  const [showCrea, setShowCrea] = useState(false);
  const [testStato, setTestStato] = useState<Record<string, boolean | null>>({});
  const [form, setForm] = useState({ nome: '', ip: '', porta: '9100', tipo: 'bar' as Stampante['tipo'] });

  const carica = async () => {
    try { setStampanti(await getStampanti()); } catch { toast('Errore caricamento', 'errore'); }
  };

  useEffect(() => { carica(); }, []);

  const handleTest = async (s: Stampante) => {
    setTestStato(p => ({ ...p, [s.id]: null }));
    try {
      const { online } = await testStampante(s.id);
      setTestStato(p => ({ ...p, [s.id]: online }));
      toast(online ? `${s.nome}: Online ✓` : `${s.nome}: Offline ✗`, online ? 'successo' : 'errore');
    } catch { setTestStato(p => ({ ...p, [s.id]: false })); }
  };

  const handleSalva = async () => {
    if (!form.nome || !form.ip) { toast('Nome e IP obbligatori', 'errore'); return; }
    try {
      if (modifica) {
        await aggiornaStampante(modifica.id, { ...form, porta: parseInt(form.porta) });
      } else {
        await creaStampante({ ...form, porta: parseInt(form.porta) });
      }
      toast('Stampante salvata');
      setModifica(null);
      setShowCrea(false);
      carica();
    } catch { toast('Errore', 'errore'); }
  };

  const handleElimina = async (s: Stampante) => {
    if (!confirm(`Eliminare ${s.nome}?`)) return;
    try { await eliminaStampante(s.id); toast('Eliminata'); carica(); }
    catch { toast('Errore', 'errore'); }
  };

  const tipoLabel: Record<Stampante['tipo'], string> = { fiscale: 'Fiscale (Epson FP-81)', cucina: 'Comanda Cucina', bar: 'Comanda Bar' };

  return (
    <div className="p-4 space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-[#e5e7eb] font-semibold">Stampanti</h2>
        <button onClick={() => { setShowCrea(true); setForm({ nome: '', ip: '', porta: '9100', tipo: 'bar' }); }} className="btn-primary text-sm px-3 py-2">+ Aggiungi</button>
      </div>

      {stampanti.map(s => (
        <div key={s.id} className="bg-[#1f2937] border border-[#374151] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  testStato[s.id] === true ? 'bg-[#10b981]' :
                  testStato[s.id] === false ? 'bg-[#ef4444]' :
                  s.attiva ? 'bg-[#6b7280]' : 'bg-[#374151]'
                }`} />
                <p className="text-[#e5e7eb] font-medium">{s.nome}</p>
              </div>
              <p className="text-[#6b7280] text-sm mt-0.5">{s.ip}:{s.porta} · {tipoLabel[s.tipo]}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleTest(s)} className="btn-ghost text-xs px-3 py-2">Test</button>
              <button
                onClick={() => { setModifica(s); setForm({ nome: s.nome, ip: s.ip, porta: String(s.porta), tipo: s.tipo }); }}
                className="btn-ghost text-xs px-3 py-2"
              >Modifica</button>
              <button onClick={() => handleElimina(s)} className="btn-danger text-xs px-3 py-2">✕</button>
            </div>
          </div>
        </div>
      ))}

      {(showCrea || modifica) && (
        <Modal titolo={modifica ? 'Modifica Stampante' : '+ Nuova Stampante'} onClose={() => { setShowCrea(false); setModifica(null); }}>
          <div className="p-5 space-y-4">
            <div>
              <label className="label">Nome</label>
              <input className="input" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Es: Bar principale" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Indirizzo IP</label>
                <input className="input" value={form.ip} onChange={e => setForm(f => ({ ...f, ip: e.target.value }))} placeholder="192.168.1.10" />
              </div>
              <div>
                <label className="label">Porta</label>
                <input className="input" type="number" value={form.porta} onChange={e => setForm(f => ({ ...f, porta: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="label">Tipo</label>
              <div className="flex flex-col gap-2">
                {([
                  { v: 'fiscale', label: 'Fiscale (Epson FP-81)' },
                  { v: 'cucina', label: 'Comanda Cucina' },
                  { v: 'bar', label: 'Comanda Bar' },
                ] as { v: Stampante['tipo']; label: string }[]).map(opt => (
                  <label key={opt.v} className="flex items-center gap-3 px-3 py-2.5 bg-[#374151] rounded-lg cursor-pointer">
                    <input type="radio" name="tipo" value={opt.v} checked={form.tipo === opt.v}
                      onChange={() => setForm(f => ({ ...f, tipo: opt.v }))} className="accent-[#4f46e5]" />
                    <span className="text-sm text-[#e5e7eb]">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowCrea(false); setModifica(null); }} className="btn-ghost flex-1">Annulla</button>
              <button onClick={handleSalva} className="btn-primary flex-1">Salva</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ===== PAGAMENTI =====
function SezionePagamenti() {
  const toast = useToastStore(s => s.aggiungi);
  const [stato, setStato] = useState<{ configurato: boolean; env: string; key_id: string | null } | null>(null);

  useEffect(() => {
    getStatoSatispay().then(setStato).catch(() => toast('Errore caricamento', 'errore'));
  }, []);

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-[#e5e7eb] font-semibold">Pagamenti Digitali</h2>

      <div className="bg-[#1f2937] border border-[#374151] rounded-xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">📱</span>
          <div>
            <p className="text-[#e5e7eb] font-medium">Satispay Business</p>
            <p className="text-[#6b7280] text-sm">{stato?.env === 'production' ? 'Produzione' : 'Sandbox'}</p>
          </div>
          <span className={`ml-auto px-3 py-1 rounded-full text-xs font-medium ${
            stato?.configurato ? 'bg-[#064e3b] text-[#6ee7b7]' : 'bg-[#374151] text-[#6b7280]'
          }`}>
            {stato?.configurato ? '● Configurato' : '● Non configurato'}
          </span>
        </div>
        {stato?.key_id && (
          <p className="text-[#6b7280] text-xs">Key ID: {stato.key_id}</p>
        )}
        <p className="text-[#6b7280] text-xs mt-2">
          Per configurare Satispay, imposta le variabili SATISPAY_KEY_ID e SATISPAY_PRIVATE_KEY nel file .env del backend.
        </p>
      </div>

      <div className="bg-[#1f2937] border border-[#374151] rounded-xl p-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">💳</span>
          <div>
            <p className="text-[#e5e7eb] font-medium">Pagamento con Carta</p>
            <p className="text-[#6b7280] text-sm">Sempre disponibile (POS fisico esterno)</p>
          </div>
          <span className="ml-auto px-3 py-1 rounded-full text-xs font-medium bg-[#064e3b] text-[#6ee7b7]">
            ● Attivo
          </span>
        </div>
      </div>
    </div>
  );
}

// ===== UTENTI =====
function SezioneUtenti() {
  const toast = useToastStore(s => s.aggiungi);
  const [utenti, setUtenti] = useState<Utente[]>([]);
  const [modifica, setModifica] = useState<Utente | null>(null);
  const [showCrea, setShowCrea] = useState(false);
  const [form, setForm] = useState({ nome: '', email: '', password: '', ruolo: 'cameriere' as Utente['ruolo'] });

  const carica = async () => {
    try { setUtenti(await getUtenti()); } catch { toast('Errore', 'errore'); }
  };

  useEffect(() => { carica(); }, []);

  const handleSalva = async () => {
    try {
      if (modifica) {
        await aggiornaUtente(modifica.id, { nome: form.nome, ruolo: form.ruolo, ...(form.password ? { password: form.password } : {}) });
      } else {
        await creaUtente(form);
      }
      toast('Utente salvato');
      setModifica(null); setShowCrea(false);
      carica();
    } catch { toast('Errore', 'errore'); }
  };

  const handleToggle = async (u: Utente) => {
    try {
      await aggiornaUtente(u.id, { attivo: !u.attivo });
      toast(u.attivo ? 'Utente disabilitato' : 'Utente abilitato');
      carica();
    } catch { toast('Errore', 'errore'); }
  };

  const ruoloLabel = { admin: 'Admin', cassiere: 'Cassiere', cameriere: 'Cameriere' };

  return (
    <div className="p-4 space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-[#e5e7eb] font-semibold">Utenti</h2>
        <button onClick={() => { setShowCrea(true); setForm({ nome: '', email: '', password: '', ruolo: 'cameriere' }); }} className="btn-primary text-sm px-3 py-2">+ Utente</button>
      </div>

      {utenti.map(u => (
        <div key={u.id} className={`bg-[#1f2937] border rounded-xl p-4 flex items-center gap-3 ${u.attivo ? 'border-[#374151]' : 'border-[#374151] opacity-50'}`}>
          <div className="w-10 h-10 bg-[#4f46e5] rounded-full flex items-center justify-center text-white font-bold">
            {u.nome[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="text-[#e5e7eb] font-medium">{u.nome}</p>
            <p className="text-[#6b7280] text-sm">{u.email} · {ruoloLabel[u.ruolo]}</p>
          </div>
          <button
            onClick={() => { setModifica(u); setForm({ nome: u.nome, email: u.email, password: '', ruolo: u.ruolo }); }}
            className="btn-ghost text-xs px-3 py-2"
          >Modifica</button>
          <button onClick={() => handleToggle(u)} className={`text-xs px-3 py-2 rounded-lg ${u.attivo ? 'btn-danger' : 'btn-success'}`}>
            {u.attivo ? 'Disabilita' : 'Abilita'}
          </button>
        </div>
      ))}

      {(showCrea || modifica) && (
        <Modal titolo={modifica ? 'Modifica Utente' : '+ Nuovo Utente'} onClose={() => { setShowCrea(false); setModifica(null); }}>
          <div className="p-5 space-y-4">
            <div>
              <label className="label">Nome</label>
              <input className="input" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
            </div>
            {!modifica && (
              <div>
                <label className="label">Email</label>
                <input className="input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
            )}
            <div>
              <label className="label">{modifica ? 'Nuova Password (lascia vuoto per non cambiare)' : 'Password'}</label>
              <input className="input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>
            <div>
              <label className="label">Ruolo</label>
              <div className="flex gap-2">
                {(['admin', 'cassiere', 'cameriere'] as Utente['ruolo'][]).map(r => (
                  <button key={r} onClick={() => setForm(f => ({ ...f, ruolo: r }))}
                    className={`flex-1 py-2 rounded-lg text-sm capitalize ${form.ruolo === r ? 'bg-[#4f46e5] text-white' : 'bg-[#374151] text-[#6b7280]'}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowCrea(false); setModifica(null); }} className="btn-ghost flex-1">Annulla</button>
              <button onClick={handleSalva} className="btn-primary flex-1">Salva</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
