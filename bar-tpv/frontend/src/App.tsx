import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAppStore } from './store/useAppStore';
import { useOnline } from './hooks/useOnline';
import { useRealtime } from './hooks/useRealtime';
import { getProdotti, getCategorie, getAttributi } from './lib/api';
import { DEMO_TOKEN, DEMO_CATEGORIE, DEMO_PRODOTTI, DEMO_ATTRIBUTI } from './lib/demo';
import TopBar from './components/TopBar';
import NavBar from './components/NavBar';
import Toast from './components/Toast';
import Login from './pages/Login';
import PagamentoRapido from './pages/PagamentoRapido';
import Tavoli from './pages/Tavoli';
import DettaglioTavolo from './pages/DettaglioTavolo';
import Magazzino from './pages/Magazzino';
import Impostazioni from './pages/Impostazioni';
import Analytics from './pages/Analytics';

export const isDemoMode = () => localStorage.getItem('bartpv_token') === DEMO_TOKEN;

function AppLayout() {
  const { utente, token, setProdotti, setCategorie, setAttributi } = useAppStore();
  const navigate = useNavigate();
  useOnline();
  useRealtime();

  useEffect(() => {
    if (!token || !utente) { navigate('/login'); return; }

    if (token === DEMO_TOKEN) {
      // Modalità demo — usa dati locali
      setCategorie(DEMO_CATEGORIE);
      setProdotti(DEMO_PRODOTTI);
      setAttributi(DEMO_ATTRIBUTI);
      return;
    }

    const caricaDati = async () => {
      try {
        const [prodotti, categorie, attributi] = await Promise.all([
          getProdotti(), getCategorie(), getAttributi(),
        ]);
        setProdotti(prodotti);
        setCategorie(categorie);
        setAttributi(attributi);
      } catch {
        // Token scaduto → gestito da interceptor axios
      }
    };
    caricaDati();
  }, [token, utente, navigate, setProdotti, setCategorie, setAttributi]);

  if (!token || !utente) return null;

  return (
    <div className="h-screen flex flex-col bg-[#111827] text-[#e5e7eb] overflow-hidden">
      <TopBar />
      {token === DEMO_TOKEN && (
        <div className="bg-[#92400e]/40 border-b border-[#92400e] px-4 py-1.5 text-center shrink-0">
          <p className="text-[#fcd34d] text-xs font-medium">
            ⚡ Modalità Demo — I dati non vengono salvati. Avvia il backend per la versione completa.
          </p>
        </div>
      )}
      <main className="flex-1 flex flex-col overflow-hidden">
        <Routes>
          <Route path="/" element={<PagamentoRapido />} />
          <Route path="/tavoli" element={<Tavoli />} />
          <Route path="/tavoli/:id" element={<DettaglioTavolo />} />
          <Route path="/magazzino" element={<Magazzino />} />
          {utente.ruolo === 'admin' && (
            <>
              <Route path="/impostazioni" element={<Impostazioni />} />
              <Route path="/analytics" element={<Analytics />} />
            </>
          )}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <NavBar />
      <Toast />
    </div>
  );
}

export default function App() {
  const token = useAppStore(s => s.token);

  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/*" element={token ? <AppLayout /> : <Navigate to="/login" replace />} />
    </Routes>
  );
}
