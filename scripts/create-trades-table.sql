-- Tabela de trocas/cessões de jogadores entre equipes
CREATE TABLE IF NOT EXISTS trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  from_team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  to_team_id uuid NOT NULL REFERENCES teams(id),
  trade_type text NOT NULL CHECK (trade_type IN ('TROCA', 'CESSAO')),
  linked_trade_id uuid REFERENCES trades(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trades_player_id ON trades(player_id);
CREATE INDEX IF NOT EXISTS idx_trades_from_team_id ON trades(from_team_id);
CREATE INDEX IF NOT EXISTS idx_trades_to_team_id ON trades(to_team_id);

ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "trades_anon_read" ON trades FOR SELECT TO anon USING (true);
CREATE POLICY IF NOT EXISTS "trades_auth_read" ON trades FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "trades_auth_insert" ON trades FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "trades_auth_update" ON trades FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "trades_auth_delete" ON trades FOR DELETE TO authenticated USING (true);
