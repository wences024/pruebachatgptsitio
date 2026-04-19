import { ReactNode } from 'react';

interface Props {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function FullScreenModal({ open, title, onClose, children }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-app-bg/95 animate-pop">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-app-border px-5 py-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="min-h-11 rounded-2xl border border-app-border px-4">Chiudi</button>
        </div>
        <div className="flex-1 overflow-auto p-5">{children}</div>
      </div>
    </div>
  );
}
