import { NavLink } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';

const tabs = [
  { to: '/', label: 'Rapido', icon: '⚡' },
  { to: '/tavoli', label: 'Tavoli', icon: '🗺️' },
  { to: '/magazzino', label: 'Magazzino', icon: '📦' },
  { to: '/impostazioni', label: 'Impostazioni', icon: '⚙️', ruoli: ['admin'] as const },
  { to: '/analytics', label: 'Analytics', icon: '📊', ruoli: ['admin'] as const },
];

export default function NavBar() {
  const ruolo = useAppStore(s => s.utente?.ruolo);

  const visibili = tabs.filter(t => {
    if (!t.ruoli) return true;
    return ruolo && t.ruoli.includes(ruolo as 'admin');
  });

  return (
    <nav className="bg-[#1f2937] border-t border-[#374151] flex shrink-0">
      {visibili.map(t => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.to === '/'}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-h-[52px] transition-colors
             ${isActive
               ? 'text-[#4f46e5] border-t-2 border-[#4f46e5] -mt-px'
               : 'text-[#6b7280] active:text-[#e5e7eb]'
             }`
          }
        >
          <span className="text-xl leading-none">{t.icon}</span>
          <span className="text-[10px] font-medium leading-none mt-0.5">{t.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
