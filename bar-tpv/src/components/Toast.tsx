import { useToastStore } from '../store/useToastStore';

export default function Toast() {
  const toasts = useToastStore(s => s.toasts);
  const rimuovi = useToastStore(s => s.rimuovi);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          onClick={() => rimuovi(t.id)}
          className={`
            px-5 py-3 rounded-xl text-sm font-medium shadow-xl pointer-events-auto
            animate-[fadeInUp_0.15s_ease-out]
            ${t.tipo === 'successo' ? 'bg-[#059669] text-white' : ''}
            ${t.tipo === 'errore'   ? 'bg-[#dc2626] text-white' : ''}
            ${t.tipo === 'info'     ? 'bg-[#374151] text-[#e5e7eb]' : ''}
          `}
        >
          {t.messaggio}
        </div>
      ))}
    </div>
  );
}
