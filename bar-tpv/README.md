# Bar TPV

Applicazione PWA per la gestione di un bar/ristorante in Italia, ottimizzata per iPad ma accessibile da qualsiasi dispositivo.

## Stack
- Frontend: React + TypeScript + Vite + Tailwind CSS + Zustand + React Router
- Backend: Node.js + Express + TypeScript + PostgreSQL
- Tempo reale: Supabase Realtime o Socket.io (qui predisposto con Socket.io)
- PWA: vite-plugin-pwa
- Hosting: Vercel (frontend) + Railway (backend)

## Struttura
```
/
├── frontend/
├── backend/
├── shared/
├── README.md
└── package.json
```

## Avvio rapido
### 1. Installa le dipendenze
```bash
npm install
npm --workspace frontend install
npm --workspace backend install
npm --workspace shared install
```

### 2. Configura le variabili ambiente
Copia i file `.env.example` in `frontend/.env` e `backend/.env`.

### 3. Avvia in sviluppo
```bash
npm run dev:backend
npm run dev:frontend
```

## Funzionalità incluse in questa base
- Login JWT con ruoli admin/cassiere/cameriere
- Dashboard principale con barra superiore e stato online/offline
- Pagamento rapido con categorie, prodotti, scontrino e modali full screen
- Gestione tavoli e sale con stato in tempo reale predisposto
- Magazzino prodotti/categorie/attributi
- Impostazioni stampanti, Satispay e utenti
- Dashboard analytics admin
- Schema PostgreSQL completo e seed di esempio
- Service layer per Epson FP-81, comande, cassetto e Satispay
- PWA installabile su iPad
- Coda offline con IndexedDB predisposta

## Note implementative
- La logica realtime è predisposta sia lato client sia lato server tramite Socket.io.
- La parte fiscale è isolata in `backend/src/services/epson.ts`.
- La parte Satispay è isolata in `backend/src/services/satispay.ts`.
- Il progetto contiene dati demo e API stub dove l'integrazione reale richiede credenziali/dispositivi fisici.
