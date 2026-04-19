import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useToastStore } from '../store/useToastStore';
import { apriCassetto, inviaZReport, getRiepilogoOggi } from '../lib/api';
import Modal from './Modal';

interface Riepilogo {
  totale: number;
  contanti: number;
  carta: number;
  satispay: number;
  num_transazioni: number;
}

export default function TopBar() {
  const isOnline = useAppStore(s => s.isOnline);
  const utente = useAppStore(s => s.utente);
  const logout = useAppStore(s => s.logout);
  const toast = useToastStore(s => s.aggiungi);
  const [showChiusura, setShowChiusura] = useState(false);
  const [riepilogo, setRiepilogo] = useState<Riepilogo | null>(null);
  const [loading, setLoading] = useState(false);

  const handleApriCassetto = async () => {
    try {
      await apriCassetto();
      toast('Cassetto aperto');
    } catch {
      toast('Stampante non raggiungibile', 'errore');
    }
  };

  const handleChiusura = async () => {
    try {
      const data = await getRiepilogoOggi();
      setRiepilogo(data);
      setShowChiusura(true);
    } catch {
      toast('Errore caricamento riepilogo', 'errore');
    }
  };

  const handleConfermaChiusura = async () => {
    setLoading(true);
    try {
      await inviaZReport();
      toast('Z-Report inviato alla stampante fiscale');
      setShowChiusura(false);
    } catch {
      toast('Errore invio Z-Report', 'errore');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header className="bg-[#1f2937] border-b border-[#374151] px-4 py-2 flex items-center justify-between shrink-0 h-14">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-[#4f46e5]">Bar TPV</span>
          <span className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${
            isOnline ? 'bg-[#064e3b] text-[#6ee7b7]' : 'bg-[#7f1d1d] text-[#fca5a5]'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-[#10b981]' : 'bg-[#ef4444]'}`} />
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleApriCassetto}
            className="btn-ghost text-sm px-3 py-2 h-9"
            title="Apri cassetto"
          >
            🔓 Cassetto
          </button>
          <button
            onClick={handleChiusura}
            className="btn-ghost text-sm px-3 py-2 h-9"
            title="Chiusura giornata"
          >
            📋 Chiusura
          </button>
          {utente && (
            <button
              onClick={logout}
              className="text-[#6b7280] text-sm px-3 py-2 h-9 rounded-lg active:bg-[#374151]"
              title={`Logout (${utente.nome})`}
            >
              {utente.nome.split(' ')[0]} ↗
            </button>
          )}
        </div>
      </header>

      {showChiusura && riepilogo && (
        <Modal titolo="📋 Chiusura Giornata" onClose={() => setShowChiusura(false)}>
          <div className="p-5 space-y-5">
            <p className="text-[#6b7280] text-sm">
              Riepilogo vendite di oggi — {new Date().toLocaleDateString('it-IT', { dateStyle: 'full' })}
            </p>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Totale vendite', valore: riepilogo.totale, colore: 'text-[#f59e0b]' },
                { label: 'Transazioni', valore: riepilogo.num_transazioni, colore: 'text-[#e5e7eb]', raw: true },
                { label: '💵 Contanti', valore: riepilogo.contanti, colore: 'text-[#34d399]' },
                { label: '💳 Carta', valore: riepilogo.carta, colore: 'text-[#60a5fa]' },
                { label: '📱 Satispay', valore: riepilogo.satispay, colore: 'text-[#a78bfa]' },
              ].map(item => (
                <div key={item.label} className="bg-[#111827] rounded-xl p-3 border border-[#374151]">
                  <p className="text-[#6b7280] text-xs">{item.label}</p>
                  <p className={`text-xl font-bold mt-1 ${item.colore}`}>
                    {item.raw ? item.valore : `€ ${Number(item.valore).toFixed(2)}`}
                  </p>
                </div>
              ))}
            </div>

            <div className="bg-[#7c2d12]/20 border border-[#7c2d12]/50 rounded-xl p-4">
              <p className="text-[#fca5a5] text-sm font-medium">⚠️ Attenzione</p>
              <p className="text-[#6b7280] text-xs mt-1">
                Questa operazione invia il Z-Report alla stampante fiscale Epson FP-81 e chiude la giornata contabile.
              </p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowChiusura(false)} className="btn-ghost flex-1">
                Annulla
              </button>
              <button
                onClick={handleConfermaChiusura}
                disabled={loading}
                className="btn-danger flex-1"
              >
                {loading ? 'Invio...' : '🖨 Invia Z-Report'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
