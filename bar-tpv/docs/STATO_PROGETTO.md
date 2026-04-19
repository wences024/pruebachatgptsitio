# Stato della base consegnata

## Già incluso
- Monorepo frontend/backend/shared
- UI in italiano con tema scuro richiesto
- PWA installabile
- Login JWT demo con ruoli
- Schermate: Tavoli, Pagamento rapido, Magazzino, Impostazioni, Analytics
- API base e servizi separati per Epson e Satispay
- Schema SQL completo e seed demo
- Predisposizione realtime e offline queue

## Da completare per produzione
- Persistenza reale CRUD con PostgreSQL
- Middleware ruoli applicato a tutte le rotte sensibili
- Modal avanzati completi per attributi, pagamento parziale e divisione conto
- Integrazione reale Epson FP-81 con SDK/protocollo certificato del modello installato
- Integrazione reale Satispay Business con webhook firmati
- Sincronizzazione offline -> online completa per ordini e righe
- Export PDF/Excel analytics
- Test automatici frontend/backend
