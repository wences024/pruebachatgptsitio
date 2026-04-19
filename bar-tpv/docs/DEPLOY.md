# Deploy suggerito

## Frontend su Vercel
- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Variabili: `VITE_API_URL`, `VITE_SOCKET_URL`

## Backend su Railway
- Root directory: `backend`
- Start command: `npm run start`
- Variabili: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `EPSON_*`, `SATISPAY_*`

## Database PostgreSQL
- Eseguire `backend/sql/schema.sql`
- Poi `backend/sql/seed.sql`

## Realtime
- In produzione puoi mantenere Socket.io oppure sostituire con Supabase Realtime sui canali:
  - tavoli
  - ordini
  - righe_ordine
  - prodotti
