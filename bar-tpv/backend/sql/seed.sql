INSERT INTO categorie (id, nome, emoji, destinazione_stampa, ordine) VALUES
('11111111-1111-1111-1111-111111111111', 'Cocktail', '🍸', 'bar', 1),
('22222222-2222-2222-2222-222222222222', 'Birre', '🍺', 'bar', 2),
('33333333-3333-3333-3333-333333333333', 'Cucina', '🍔', 'cucina', 3);

INSERT INTO attributi (id, nome, valori, max_selezionabili) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Formato', '[{"valore":"33cl","prezzo_aggiunta":0},{"valore":"66cl","prezzo_aggiunta":2.5}]', 1),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Extra', '[{"valore":"Ghiaccio","prezzo_aggiunta":0},{"valore":"Tonica premium","prezzo_aggiunta":1.5}]', 2);

INSERT INTO prodotti (id, nome, emoji, categoria_id, prezzo, costo, stock, stock_minimo, attributi_ids, attivo) VALUES
('aaaaaaaa-1111-1111-1111-111111111111', 'Gin Tonic', '🍸', '11111111-1111-1111-1111-111111111111', 8.00, 2.50, 48, 8, ARRAY['bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb']::UUID[], true),
('bbbbbbbb-2222-2222-2222-222222222222', 'Moretti', '🍺', '22222222-2222-2222-2222-222222222222', 4.00, 1.20, 20, 6, ARRAY['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa']::UUID[], true),
('cccccccc-3333-3333-3333-333333333333', 'Hamburger', '🍔', '33333333-3333-3333-3333-333333333333', 12.00, 4.50, 10, 3, ARRAY[]::UUID[], true);
