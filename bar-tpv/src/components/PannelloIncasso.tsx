import { useState } from 'react';
import { useToastStore } from '../store/useToastStore';
import { useAppStore } from '../store/useAppStore';
import { pagaOrdine, stampaComanda, creaPagamentoSatispay, verificaSatispay } from '../lib/api';
import { DEMO_TOKEN } from '../lib/demo';
import Modal from './Modal';
import type { RigaScontrino } from '../store/useScontrinoStore';
import type { MetodoPagamento, TipoTransazione } from '../../../shared/types';

interface Props {
  ordine_id: string | null;
  righe: RigaScontrino[];
  tavolo_numero?: number;
  onPagato: () => void;
  onStampaComanda?: () => void;
}

type ModalType = 'conferma' | 'selezione_parziale' | 'satispay_qr' | null;

export default function PannelloIncasso({ ordine_id, righe, tavolo_numero, onPagato, onStampaComanda }: Props) {
  const toast = useToastStore(s => s.aggiungi);
  const isOnline = useAppStore(s => s.isOnline);

  const [modalType, setModalType] = useState<ModalType>(null);
  const [tipoSelezionato, setTipoSelezionato] = useState<TipoTransazione>('totale');
  const [metodoPagamento, setMetodoPagamento] = useState<MetodoPagamento | null>(null);
  const [numPersone, setNumPersone] = useState(2);
  const [qrCode, setQrCode] = useState<string>('');
  const [paymentId, setPaymentId] = useState<string>('');
  const [loadingPaga, setLoadingPaga] = useState(false);

  // Per selezione parziale: quantità da pagare per riga selezionata
  const [qtaParziali, setQtaParziali] = useState<Record<string, number>>({});

  const righeSelezionate = righe.filter(r => r.selezionata);
  const totaleGenerale = righe.reduce((s, r) => s + r.quantita * r.prezzo_unitario, 0);
  const totaleSelezionato = righeSelezionate.reduce((s, r) => s + r.quantita * r.prezzo_unitario, 0);

  const importoDivisione = totaleGenerale / numPersone;

  const importoAttuale =
    tipoSelezionato === 'totale' ? totaleGenerale :
    tipoSelezionato === 'selezione' ? totaleSelezionato :
    importoDivisione;

  const handleMetodoClic = async (metodo: MetodoPagamento) => {
    if (!isOnline) { toast('Connessione assente — pagamento non disponibile', 'errore'); return; }
    if (!ordine_id) { toast('Nessun ordine attivo', 'errore'); return; }
    if (righe.length === 0) { toast('Scontrino vuoto', 'errore'); return; }
    if (tipoSelezionato === 'selezione' && righeSelezionate.length === 0) {
      toast('Seleziona almeno un prodotto', 'errore'); return;
    }

    setMetodoPagamento(metodo);

    if (metodo === 'satispay') {
      setLoadingPaga(true);
      try {
        const { payment_id, qr_code } = await creaPagamentoSatispay(importoAttuale, ordine_id);
        setPaymentId(payment_id);
        setQrCode(qr_code);
        setModalType('satispay_qr');
      } catch {
        toast('Errore creazione pagamento Satispay', 'errore');
      } finally {
        setLoadingPaga(false);
      }
      return;
    }

    if (tipoSelezionato === 'selezione') {
      const init: Record<string, number> = {};
      righeSelezionate.forEach(r => { init[r.id] = r.quantita; });
      setQtaParziali(init);
      setModalType('selezione_parziale');
    } else {
      setModalType('conferma');
    }
  };

  const totaleParziale = righeSelezionate.reduce((s, r) => {
    const qty = qtaParziali[r.id] ?? r.quantita;
    return s + qty * r.prezzo_unitario;
  }, 0);

  const eseguiPagamento = async () => {
    if (!ordine_id || !metodoPagamento) return;
    setLoadingPaga(true);
    const isDemo = localStorage.getItem('bartpv_token') === DEMO_TOKEN;
    if (isDemo) {
      await new Promise(r => setTimeout(r, 600));
      toast(`✓ Demo — Pagato €${(tipoSelezionato === 'selezione' ? totaleParziale : importoAttuale).toFixed(2)} in ${metodoPagamento}`);
      setModalType(null);
      onPagato();
      setLoadingPaga(false);
      return;
    }
    try {
      const payload: Record<string, unknown> = {
        ordine_id,
        tipo: tipoSelezionato,
        metodo: metodoPagamento,
        importo: tipoSelezionato === 'selezione' ? totaleParziale : importoAttuale,
        num_persone: tipoSelezionato === 'divisione' ? numPersone : undefined,
      };

      if (tipoSelezionato === 'selezione') {
        payload.righe_pagate = righeSelezionate.map(r => ({
          riga_id: r.id,
          quantita_pagata: qtaParziali[r.id] ?? r.quantita,
        }));
      }

      await pagaOrdine(payload);
      toast(`✓ Pagato €${(tipoSelezionato === 'selezione' ? totaleParziale : importoAttuale).toFixed(2)} in ${metodoPagamento}`);
      setModalType(null);
      onPagato();
    } catch {
      toast('Errore durante il pagamento', 'errore');
    } finally {
      setLoadingPaga(false);
    }
  };

  const verificaEPagaSatispay = async () => {
    if (!paymentId) return;
    setLoadingPaga(true);
    try {
      const payment = await verificaSatispay(paymentId);
      if (payment.status === 'ACCEPTED') {
        setModalType('conferma');
      } else {
        toast('Pagamento non ancora confermato', 'info');
      }
    } catch {
      toast('Errore verifica Satispay', 'errore');
    } finally {
      setLoadingPaga(false);
    }
  };

  const handleStampaComanda = async () => {
    if (!ordine_id) { toast('Nessun ordine attivo', 'errore'); return; }
    const isDemo = localStorage.getItem('bartpv_token') === DEMO_TOKEN;
    if (isDemo) { toast('🖨 Demo — Comanda inviata alle stampanti'); onStampaComanda?.(); return; }
    if (!isOnline) { toast('Connessione assente', 'errore'); return; }
    try {
      const result = await stampaComanda(ordine_id, tavolo_numero);
      if (result.errori?.length > 0) {
        toast(`Comanda inviata con avvisi: ${result.errori.join(', ')}`, 'info');
      } else {
        toast(`🖨 Comanda inviata (bar: ${result.righe_bar}, cucina: ${result.righe_cucina})`);
      }
      onStampaComanda?.();
    } catch {
      toast('Errore stampa comanda', 'errore');
    }
  };

  return (
    <>
      <div className="bg-[#111827] rounded-xl border border-[#374151] p-3 flex flex-col gap-3">
        {/* Totali */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-[#6b7280]">Totale</span>
            <span className="text-[#e5e7eb] font-bold text-base">€ {totaleGenerale.toFixed(2)}</span>
          </div>
          {righeSelezionate.length > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-[#6b7280]">Selezione ({righeSelezionate.length})</span>
              <span className="text-[#f59e0b] font-semibold">€ {totaleSelezionato.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Pulsante comanda */}
        <button
          onClick={handleStampaComanda}
          className="w-full py-2.5 bg-[#1f2937] border border-[#374151] rounded-lg text-sm text-[#e5e7eb] font-medium active:bg-[#374151]"
        >
          🖨 Stampa Comanda
        </button>

        {/* Tipo pagamento */}
        <div>
          <p className="label">Modalità pagamento</p>
          <div className="flex gap-1">
            {(['totale', 'selezione', 'divisione'] as TipoTransazione[]).map(t => (
              <button
                key={t}
                onClick={() => setTipoSelezionato(t)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                  tipoSelezionato === t
                    ? 'bg-[#4f46e5] text-white'
                    : 'bg-[#374151] text-[#6b7280] active:bg-[#4b5563]'
                }`}
              >
                {t === 'totale' ? 'Totale' : t === 'selezione' ? 'Selezione' : 'Dividi'}
              </button>
            ))}
          </div>
          {tipoSelezionato === 'divisione' && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-[#6b7280]">Persone:</span>
              <div className="flex items-center gap-2 bg-[#0d1117] rounded-lg px-2">
                <button onClick={() => setNumPersone(p => Math.max(2, p - 1))}
                  className="text-[#e5e7eb] text-lg w-8 h-9 flex items-center justify-center">−</button>
                <span className="text-[#e5e7eb] font-bold w-6 text-center">{numPersone}</span>
                <button onClick={() => setNumPersone(p => p + 1)}
                  className="text-[#e5e7eb] text-lg w-8 h-9 flex items-center justify-center">+</button>
              </div>
              <span className="text-xs text-[#f59e0b] font-semibold ml-auto">
                € {importoDivisione.toFixed(2)} / p.
              </span>
            </div>
          )}
        </div>

        {/* Metodi pagamento */}
        <div>
          <p className="label">Incassa con</p>
          <div className="flex flex-col gap-2">
            {[
              { metodo: 'contanti' as MetodoPagamento, label: '💵 Contanti', color: 'bg-[#064e3b] active:bg-[#065f46] text-[#6ee7b7]' },
              { metodo: 'carta' as MetodoPagamento, label: '💳 Carta', color: 'bg-[#1e3a5f] active:bg-[#1e40af] text-[#93c5fd]' },
              { metodo: 'satispay' as MetodoPagamento, label: '📱 Satispay', color: 'bg-[#3b1f6e] active:bg-[#4c1d95] text-[#c4b5fd]' },
            ].map(({ metodo, label, color }) => (
              <button
                key={metodo}
                onClick={() => handleMetodoClic(metodo)}
                disabled={loadingPaga}
                className={`w-full py-3 rounded-xl font-semibold text-sm ${color} flex items-center justify-between px-4 min-h-[52px]`}
              >
                <span>{label}</span>
                <span className="font-bold">
                  € {(tipoSelezionato === 'selezione' ? totaleParziale || totaleSelezionato : importoAttuale).toFixed(2)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Modal conferma */}
      {modalType === 'conferma' && metodoPagamento && (
        <Modal titolo="🖨 Conferma Pagamento" onClose={() => setModalType(null)}>
          <div className="p-5 space-y-4">
            <div className="bg-[#111827] rounded-xl border border-[#374151] p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-[#6b7280] text-sm">Tipo</span>
                <span className="text-[#e5e7eb] font-medium capitalize">{tipoSelezionato}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6b7280] text-sm">Metodo</span>
                <span className="text-[#e5e7eb] font-medium capitalize">{metodoPagamento}</span>
              </div>
              <div className="flex justify-between border-t border-[#374151] pt-2">
                <span className="text-[#6b7280] text-sm">Importo</span>
                <span className="text-[#f59e0b] font-bold text-lg">
                  € {(tipoSelezionato === 'selezione' ? totaleParziale : importoAttuale).toFixed(2)}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setModalType(null)} className="btn-ghost flex-1">Annulla</button>
              <button onClick={eseguiPagamento} disabled={loadingPaga} className="btn-success flex-1">
                {loadingPaga ? 'Elaborazione...' : '✓ Stampato, conferma'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal selezione parziale quantità */}
      {modalType === 'selezione_parziale' && metodoPagamento && (
        <Modal titolo="Selezione Quantità" onClose={() => setModalType(null)}>
          <div className="p-5 space-y-3">
            {righeSelezionate.map(r => (
              <div key={r.id} className="flex items-center gap-3 bg-[#111827] rounded-xl border border-[#374151] p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[#e5e7eb] text-sm font-medium truncate">{r.nome_prodotto}</p>
                  <p className="text-[#6b7280] text-xs">Disponibili: {r.quantita} × € {r.prezzo_unitario.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setQtaParziali(p => ({ ...p, [r.id]: Math.max(1, (p[r.id] ?? r.quantita) - 1) }))}
                    className="w-9 h-9 bg-[#374151] rounded-lg text-lg flex items-center justify-center active:bg-[#4b5563]"
                  >−</button>
                  <span className="text-[#f59e0b] font-bold w-8 text-center">
                    {qtaParziali[r.id] ?? r.quantita}
                  </span>
                  <button
                    onClick={() => setQtaParziali(p => ({ ...p, [r.id]: Math.min(r.quantita, (p[r.id] ?? r.quantita) + 1) }))}
                    className="w-9 h-9 bg-[#374151] rounded-lg text-lg flex items-center justify-center active:bg-[#4b5563]"
                  >+</button>
                </div>
                <span className="text-[#e5e7eb] font-semibold text-sm w-16 text-right">
                  € {((qtaParziali[r.id] ?? r.quantita) * r.prezzo_unitario).toFixed(2)}
                </span>
              </div>
            ))}

            <div className="flex justify-between border-t border-[#374151] pt-3">
              <span className="text-[#6b7280]">Totale da pagare</span>
              <span className="text-[#f59e0b] font-bold text-lg">€ {totaleParziale.toFixed(2)}</span>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setModalType(null)} className="btn-ghost flex-1">Annulla</button>
              <button onClick={() => setModalType('conferma')} className="btn-success flex-1">
                Procedi →
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal QR Satispay */}
      {modalType === 'satispay_qr' && (
        <Modal titolo="📱 Pagamento Satispay" onClose={() => setModalType(null)}>
          <div className="p-5 space-y-4 text-center">
            <p className="text-[#6b7280] text-sm">
              Mostra il QR code al cliente per completare il pagamento
            </p>
            {qrCode && (
              <img src={qrCode} alt="QR Satispay" className="mx-auto w-48 h-48 rounded-xl" />
            )}
            <p className="text-[#f59e0b] font-bold text-2xl">
              € {importoAttuale.toFixed(2)}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setModalType(null)} className="btn-ghost flex-1">Annulla</button>
              <button onClick={verificaEPagaSatispay} disabled={loadingPaga} className="btn-primary flex-1">
                {loadingPaga ? 'Verifica...' : '✓ Verifica pagamento'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
