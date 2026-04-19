import { NavLink, Outlet } from 'react-router-dom';
import { useUiStore } from '@/store/ui';
import { Bell, Box, CreditCard, DoorOpen, LineChart, Settings, TableProperties } from 'lucide-react';
import { toast } from 'sonner';

const navItems = [
  { to: '/rapido', label: '⚡ Pagamento rapido', icon: CreditCard },
  { to: '/tavoli', label: '🗺 Tavoli', icon: TableProperties },
  { to: '/magazzino', label: '📦 Magazzino', icon: Box },
  { to: '/impostazioni', label: '⚙ Impostazioni', icon: Settings },
  { to: '/analytics', label: '📈 Analytics', icon: LineChart }
];

export function AppShell() {
  const isOnline = useUiStore((state) => state.isOnline);

  return (
    <div className="min-h-screen bg-app-bg text-app-text">
      <header className="sticky top-0 z-20 border-b border-app-border bg-app-bg/95 backdrop-blur">
        <div className="flex min-h-[72px] items-center justify-between px-4 py-3 md:px-6">
          <div>
            <div className="text-xl font-bold">Bar TPV</div>
            <div className={`text-sm ${isOnline ? 'text-app-success' : 'text-app-danger'}`}>
              ● {isOnline ? 'Online' : 'Offline'}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => toast.success('Comando cassetto inviato')} className="min-h-11 rounded-2xl border border-app-border bg-app-card px-4 text-sm font-medium">
              <DoorOpen className="mr-2 inline h-4 w-4" />
              🔓 Apri cassetto
            </button>
            <button onClick={() => toast('Riepilogo giornaliero aperto')} className="min-h-11 rounded-2xl bg-app-primary px-4 text-sm font-semibold">
              <Bell className="mr-2 inline h-4 w-4" />
              📋 Chiusura giornata
            </button>
          </div>
        </div>
        <nav className="grid grid-cols-2 gap-2 px-4 pb-4 md:flex md:flex-wrap md:px-6">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `min-h-11 rounded-2xl border px-4 py-3 text-sm ${isActive ? 'border-app-primary bg-app-primary text-white' : 'border-app-border bg-app-card text-app-text'}`}
            >
              <Icon className="mr-2 inline h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
}
