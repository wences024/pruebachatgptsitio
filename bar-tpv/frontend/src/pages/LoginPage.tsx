import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';

export function LoginPage() {
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@bartpv.it');
  const [password, setPassword] = useState('admin123');
  const [errore, setErrore] = useState('');

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      await login(email, password);
      navigate('/tavoli');
    } catch {
      setErrore('Credenziali non valide');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-app-bg p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-3xl border border-app-border bg-app-card p-6 shadow-soft">
        <h1 className="text-2xl font-bold">Accesso Bar TPV</h1>
        <p className="mt-2 text-sm text-app-muted">Login persistente per iPad e altri dispositivi.</p>
        <div className="mt-6 space-y-4">
          <label className="block text-sm">
            <span>Email</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 min-h-11 w-full rounded-2xl border border-app-border bg-app-input px-4" />
          </label>
          <label className="block text-sm">
            <span>Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 min-h-11 w-full rounded-2xl border border-app-border bg-app-input px-4" />
          </label>
          {errore && <div className="text-sm text-app-danger">{errore}</div>}
          <button className="min-h-11 w-full rounded-2xl bg-app-primary font-semibold">Entra</button>
        </div>
      </form>
    </div>
  );
}
