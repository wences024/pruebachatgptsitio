import { useEffect, ReactNode } from 'react';

interface Props {
  titolo?: string;
  children: ReactNode;
  onClose?: () => void;
  larghezza?: string;
}

export default function Modal({ titolo, children, onClose, larghezza = 'max-w-lg' }: Props) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', handler);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handler);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className={`bg-[#1f2937] rounded-2xl border border-[#374151] w-full ${larghezza} max-h-[90vh] flex flex-col shadow-2xl`}>
        {titolo && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#374151] shrink-0">
            <h2 className="text-lg font-semibold text-[#e5e7eb]">{titolo}</h2>
            {onClose && (
              <button
                onClick={onClose}
                className="text-[#6b7280] text-2xl leading-none w-10 h-10 flex items-center justify-center rounded-lg active:bg-[#374151]"
                aria-label="Chiudi"
              >
                ×
              </button>
            )}
          </div>
        )}
        <div className="overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
