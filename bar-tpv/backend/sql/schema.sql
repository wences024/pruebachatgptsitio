CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE categorie (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR NOT NULL,
  emoji VARCHAR(10),
  destinazione_stampa VARCHAR CHECK (destinazione_stampa IN ('cucina','bar','entrambe')),
  ordine INTEGER DEFAULT 0,
  creato_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE attributi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR NOT NULL,
  valori JSONB NOT NULL,
  max_selezionabili INTEGER DEFAULT 1,
  creato_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE prodotti (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR NOT NULL,
  emoji VARCHAR(10),
  categoria_id UUID REFERENCES categorie(id) ON DELETE SET NULL,
  prezzo DECIMAL(10,2) NOT NULL,
  costo DECIMAL(10,2) DEFAULT 0,
  stock INTEGER DEFAULT 0,
  stock_minimo INTEGER DEFAULT 5,
  attributi_ids UUID[] DEFAULT '{}',
  attivo BOOLEAN DEFAULT true,
  creato_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sale (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR NOT NULL,
  ordine INTEGER DEFAULT 0
);

CREATE TABLE tavoli (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero INTEGER NOT NULL,
  sala_id UUID REFERENCES sale(id) ON DELETE CASCADE,
  stato VARCHAR CHECK (stato IN ('libero','occupato','conto')) DEFAULT 'libero'
);

CREATE TABLE ordini (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tavolo_id UUID REFERENCES tavoli(id),
  aperto_at TIMESTAMP DEFAULT NOW(),
  stato VARCHAR CHECK (stato IN ('aperto','chiuso','pagato')) DEFAULT 'aperto',
  totale DECIMAL(10,2) DEFAULT 0
);

CREATE TABLE righe_ordine (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ordine_id UUID REFERENCES ordini(id) ON DELETE CASCADE,
  prodotto_id UUID REFERENCES prodotti(id),
  nome_prodotto VARCHAR NOT NULL,
  quantita INTEGER DEFAULT 1,
  prezzo_unitario DECIMAL(10,2) NOT NULL,
  attributi_selezionati JSONB DEFAULT '{}',
  nota TEXT DEFAULT '',
  selezionata BOOLEAN DEFAULT false,
  creato_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE transazioni (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ordine_id UUID REFERENCES ordini(id),
  tipo VARCHAR CHECK (tipo IN ('totale','selezione','divisione')),
  metodo VARCHAR CHECK (metodo IN ('contanti','carta','satispay')),
  importo DECIMAL(10,2) NOT NULL,
  righe_pagate JSONB DEFAULT '[]',
  stampato BOOLEAN DEFAULT false,
  creato_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE vendite_giornaliere (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL,
  totale DECIMAL(10,2) DEFAULT 0,
  contanti DECIMAL(10,2) DEFAULT 0,
  carta DECIMAL(10,2) DEFAULT 0,
  satispay DECIMAL(10,2) DEFAULT 0,
  num_transazioni INTEGER DEFAULT 0
);

CREATE TABLE utenti (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR NOT NULL,
  email VARCHAR UNIQUE,
  password_hash VARCHAR,
  ruolo VARCHAR CHECK (ruolo IN ('admin','cassiere','cameriere')) DEFAULT 'cameriere',
  attivo BOOLEAN DEFAULT true
);

CREATE TABLE stampanti (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR NOT NULL,
  ip VARCHAR NOT NULL,
  porta INTEGER DEFAULT 9100,
  tipo VARCHAR CHECK (tipo IN ('fiscale','cucina','bar')),
  attiva BOOLEAN DEFAULT true
);
