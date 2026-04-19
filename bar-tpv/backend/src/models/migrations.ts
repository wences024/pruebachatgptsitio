import { pool } from '../db';

export async function runMigrations() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS categorie (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nome VARCHAR NOT NULL,
        emoji VARCHAR(10),
        destinazione_stampa VARCHAR CHECK (destinazione_stampa IN ('cucina','bar','entrambe')) DEFAULT 'bar',
        ordine INTEGER DEFAULT 0,
        creato_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS attributi (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nome VARCHAR NOT NULL,
        valori JSONB NOT NULL DEFAULT '[]',
        max_selezionabili INTEGER DEFAULT 1,
        creato_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS prodotti (
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
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS sale (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nome VARCHAR NOT NULL,
        ordine INTEGER DEFAULT 0
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS tavoli (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        numero INTEGER NOT NULL,
        sala_id UUID REFERENCES sale(id) ON DELETE CASCADE,
        stato VARCHAR CHECK (stato IN ('libero','occupato','conto')) DEFAULT 'libero'
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS ordini (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tavolo_id UUID REFERENCES tavoli(id),
        aperto_at TIMESTAMP DEFAULT NOW(),
        stato VARCHAR CHECK (stato IN ('aperto','chiuso','pagato')) DEFAULT 'aperto',
        totale DECIMAL(10,2) DEFAULT 0
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS righe_ordine (
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
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS transazioni (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ordine_id UUID REFERENCES ordini(id),
        tipo VARCHAR CHECK (tipo IN ('totale','selezione','divisione')),
        metodo VARCHAR CHECK (metodo IN ('contanti','carta','satispay')),
        importo DECIMAL(10,2) NOT NULL,
        righe_pagate JSONB DEFAULT '[]',
        stampato BOOLEAN DEFAULT false,
        creato_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS vendite_giornaliere (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        data DATE NOT NULL UNIQUE,
        totale DECIMAL(10,2) DEFAULT 0,
        contanti DECIMAL(10,2) DEFAULT 0,
        carta DECIMAL(10,2) DEFAULT 0,
        satispay DECIMAL(10,2) DEFAULT 0,
        num_transazioni INTEGER DEFAULT 0
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS utenti (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nome VARCHAR NOT NULL,
        email VARCHAR UNIQUE NOT NULL,
        password_hash VARCHAR NOT NULL,
        ruolo VARCHAR CHECK (ruolo IN ('admin','cassiere','cameriere')) DEFAULT 'cameriere',
        attivo BOOLEAN DEFAULT true
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS stampanti (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nome VARCHAR NOT NULL,
        ip VARCHAR NOT NULL,
        porta INTEGER DEFAULT 9100,
        tipo VARCHAR CHECK (tipo IN ('fiscale','cucina','bar')),
        attiva BOOLEAN DEFAULT true
      )
    `);

    // Seed dati iniziali
    const { rows: adminExist } = await client.query(
      `SELECT id FROM utenti WHERE email = 'admin@bartpv.it' LIMIT 1`
    );
    if (adminExist.length === 0) {
      const bcrypt = await import('bcrypt');
      const hash = await bcrypt.hash('admin123', 10);
      await client.query(
        `INSERT INTO utenti (nome, email, password_hash, ruolo) VALUES ($1, $2, $3, $4)`,
        ['Amministratore', 'admin@bartpv.it', hash, 'admin']
      );

      // Sale di default
      const { rows: [sala1] } = await client.query(
        `INSERT INTO sale (nome, ordine) VALUES ('Interno', 0) RETURNING id`
      );
      const { rows: [sala2] } = await client.query(
        `INSERT INTO sale (nome, ordine) VALUES ('Terrazza', 1) RETURNING id`
      );

      // Tavoli di default
      for (let i = 1; i <= 8; i++) {
        await client.query(
          `INSERT INTO tavoli (numero, sala_id) VALUES ($1, $2)`,
          [i, sala1.id]
        );
      }
      for (let i = 1; i <= 4; i++) {
        await client.query(
          `INSERT INTO tavoli (numero, sala_id) VALUES ($1, $2)`,
          [i, sala2.id]
        );
      }

      // Categorie di default
      const cats = [
        { nome: 'Birre', emoji: '🍺', dest: 'bar' },
        { nome: 'Vini', emoji: '🍷', dest: 'bar' },
        { nome: 'Cocktail', emoji: '🍹', dest: 'bar' },
        { nome: 'Analcolici', emoji: '🥤', dest: 'bar' },
        { nome: 'Caffetteria', emoji: '☕', dest: 'bar' },
        { nome: 'Cibo', emoji: '🍔', dest: 'cucina' },
        { nome: 'Pizze', emoji: '🍕', dest: 'cucina' },
        { nome: 'Dolci', emoji: '🍰', dest: 'cucina' },
      ];
      const catIds: Record<string, string> = {};
      for (let i = 0; i < cats.length; i++) {
        const { rows: [cat] } = await client.query(
          `INSERT INTO categorie (nome, emoji, destinazione_stampa, ordine) VALUES ($1, $2, $3, $4) RETURNING id`,
          [cats[i].nome, cats[i].emoji, cats[i].dest, i]
        );
        catIds[cats[i].nome] = cat.id;
      }

      // Attributo formato birra
      const { rows: [attrFormato] } = await client.query(
        `INSERT INTO attributi (nome, valori, max_selezionabili) VALUES ($1, $2, $3) RETURNING id`,
        ['Formato', JSON.stringify([
          { valore: '33cl', prezzo_aggiunta: 0 },
          { valore: '66cl', prezzo_aggiunta: 2.50 },
          { valore: 'Pinta', prezzo_aggiunta: 4.50 },
        ]), 1]
      );

      // Prodotti di default
      const prodotti = [
        { nome: 'Birra Moretti', emoji: '🍺', cat: 'Birre', prezzo: 4.50, costo: 1.20, stock: 48, attr: [attrFormato.id] },
        { nome: 'Birra Peroni', emoji: '🍺', cat: 'Birre', prezzo: 4.50, costo: 1.20, stock: 48, attr: [attrFormato.id] },
        { nome: 'Prosecco', emoji: '🍾', cat: 'Vini', prezzo: 5.00, costo: 2.00, stock: 24 },
        { nome: 'Vino Rosso', emoji: '🍷', cat: 'Vini', prezzo: 4.50, costo: 1.80, stock: 24 },
        { nome: 'Coca Cola', emoji: '🥤', cat: 'Analcolici', prezzo: 3.00, costo: 0.80, stock: 50 },
        { nome: 'Acqua Naturale', emoji: '💧', cat: 'Analcolici', prezzo: 1.50, costo: 0.30, stock: 100 },
        { nome: 'Acqua Frizzante', emoji: '💧', cat: 'Analcolici', prezzo: 1.50, costo: 0.30, stock: 100 },
        { nome: 'Spritz', emoji: '🍹', cat: 'Cocktail', prezzo: 6.00, costo: 2.50, stock: 30 },
        { nome: 'Negroni', emoji: '🍸', cat: 'Cocktail', prezzo: 7.00, costo: 2.80, stock: 30 },
        { nome: 'Caffè', emoji: '☕', cat: 'Caffetteria', prezzo: 1.20, costo: 0.20, stock: 200 },
        { nome: 'Cappuccino', emoji: '☕', cat: 'Caffetteria', prezzo: 1.50, costo: 0.30, stock: 100 },
        { nome: 'Hamburger', emoji: '🍔', cat: 'Cibo', prezzo: 9.00, costo: 3.50, stock: 20 },
        { nome: 'Pizza Margherita', emoji: '🍕', cat: 'Pizze', prezzo: 8.00, costo: 2.50, stock: 30 },
        { nome: 'Pizza Diavola', emoji: '🌶️', cat: 'Pizze', prezzo: 9.00, costo: 2.80, stock: 30 },
        { nome: 'Tiramisù', emoji: '🍰', cat: 'Dolci', prezzo: 4.50, costo: 1.50, stock: 15 },
      ];

      for (const p of prodotti) {
        await client.query(
          `INSERT INTO prodotti (nome, emoji, categoria_id, prezzo, costo, stock, stock_minimo, attributi_ids)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [p.nome, p.emoji, catIds[p.cat], p.prezzo, p.costo, p.stock, 5, `{${(p.attr || []).join(',')}}`]
        );
      }

      console.log('✅ Dati iniziali inseriti — Admin: admin@bartpv.it / admin123');
    }

    await client.query('COMMIT');
    console.log('✅ Migrazioni completate');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Errore migrazioni:', err);
    throw err;
  } finally {
    client.release();
  }
}
