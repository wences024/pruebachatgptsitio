import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { useToastStore } from '../store/useToastStore';
import { login } from '../lib/api';
import { DEMO_TOKEN, DEMO_UTENTE } from '../lib/demo';

export default function Login() {
  const [email, setEmail] = useState('admin@bartpv.it');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const setAuth = useAppStore(s => s.setAuth);
  const toast = useToastStore(s => s.aggiungi);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast('Inserisci email e password', 'errore'); return; }
    setLoading(true);
    try {
      const data = await login(email, password);
      setAuth(data.utente, data.token);
      navigate('/');
    } catch {
      // Backend non disponibile → modalità demo
      if (email === 'admin@bartpv.it' && password === 'admin123') {
        setAuth(DEMO_UTENTE, DEMO_TOKEN);
        toast('Accesso in modalità demo (nessun backend)', 'info');
        navigate('/');
      } else {
        toast('Credenziali non valide oppure backend non avviato', 'errore');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111827] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🍺</div>
          <h1 className="text-3xl font-bold text-[#4f46e5]">Bar TPV</h1>
          <p className="text-[#6b7280] mt-1 text-sm">Sistema di cassa per bar e ristoranti</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#1f2937] rounded-2xl border border-[#374151] p-6 space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@bartpv.it"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-2 text-base"
          >
            {loading ? 'Accesso...' : 'Accedi'}
          </button>
        </form>

        <div className="mt-4 bg-[#1f2937]/60 border border-[#374151] rounded-xl p-3 text-center">
          <p className="text-[#6b7280] text-xs font-medium">Demo senza backend</p>
          <p className="text-[#e5e7eb] text-xs mt-0.5">admin@bartpv.it · admin123</p>
        </div>
      </div>
    </div>
  );
}
