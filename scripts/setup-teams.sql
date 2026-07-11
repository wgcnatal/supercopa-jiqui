-- =============================================
-- 1. CORRIGIR RLS POLICIES (remover recursividade)
-- =============================================

-- Desabilitar RLS temporariamente para inserir dados
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE players DISABLE ROW LEVEL SECURITY;

-- Remover policies antigas que causam recursão
DROP POLICY IF EXISTS "Allow public read" ON teams;
DROP POLICY IF EXISTS "Allow authenticated insert" ON teams;
DROP POLICY IF EXISTS "Allow authenticated update" ON teams;
DROP POLICY IF EXISTS "Allow authenticated delete" ON teams;
DROP POLICY IF EXISTS "Allow public read" ON players;
DROP POLICY IF EXISTS "Allow authenticated insert" ON players;
DROP POLICY IF EXISTS "Allow authenticated update" ON players;
DROP POLICY IF EXISTS "Allow authenticated delete" ON players;

-- Reabilitar RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Criar policies simples (sem recursão)
CREATE POLICY "teams_read" ON teams FOR SELECT USING (true);
CREATE POLICY "teams_insert" ON teams FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "teams_update" ON teams FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "teams_delete" ON teams FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "players_read" ON players FOR SELECT USING (true);
CREATE POLICY "players_insert" ON players FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "players_update" ON players FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "players_delete" ON players FOR DELETE USING (auth.role() = 'authenticated');

-- =============================================
-- 2. INSERIR OS 6 TIMES
-- =============================================

INSERT INTO teams (name, short_name, color) VALUES
  ('Real Madrid', 'RMA', '#FFFFFF'),
  ('Vingador FC', 'VFC', '#FF0000'),
  ('Santos', 'SAN', '#000000'),
  ('Seleção do Jiqui', 'SJQ', '#008000'),
  ('Paçoca FC', 'PFC', '#8B4513'),
  ('Amigos do Jiqui', 'AJQ', '#0000FF');

-- =============================================
-- 3. VINCULAR REPRESENTANTES AOS TIMES
-- =============================================

-- Diego Ayala -> Real Madrid
UPDATE players SET team_id = (SELECT id FROM teams WHERE name = 'Real Madrid')
WHERE full_name ILIKE '%Diego AYALA%';

-- Anderson Vingator -> Vingador FC
UPDATE players SET team_id = (SELECT id FROM teams WHERE name = 'Vingador FC')
WHERE full_name ILIKE '%Anderson VINGATOR%';

-- Wendell Rosa -> Santos
UPDATE players SET team_id = (SELECT id FROM teams WHERE name = 'Santos')
WHERE full_name ILIKE '%Wendell Rosa%';

-- Nestor Soares -> Seleção do Jiqui
UPDATE players SET team_id = (SELECT id FROM teams WHERE name = 'Seleção do Jiqui')
WHERE full_name ILIKE '%Nestor Soares%';

-- Zé Pedro da Silva -> Paçoca FC
UPDATE players SET team_id = (SELECT id FROM teams WHERE name = 'Paçoca FC')
WHERE full_name ILIKE '%Pedro da Silva%';

-- Jesiel Biel -> Amigos do Jiqui
UPDATE players SET team_id = (SELECT id FROM teams WHERE name = 'Amigos do Jiqui')
WHERE full_name ILIKE '%JESIEL BIEL%';
