-- =============================================
-- SUPERCOPA JIQUI 2026 - Database Schema
-- =============================================

-- 1. Verify/check teams table structure
-- (Assuming teams table exists with these columns)
DO $$
BEGIN
  -- Add columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'name') THEN
    ALTER TABLE teams ADD COLUMN name text NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'short_name') THEN
    ALTER TABLE teams ADD COLUMN short_name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'color') THEN
    ALTER TABLE teams ADD COLUMN color text DEFAULT '#065f46';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'logo_url') THEN
    ALTER TABLE teams ADD COLUMN logo_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'created_at') THEN
    ALTER TABLE teams ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;
END
$$;

-- 2. Verify/check matches table structure
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'matches' AND column_name = 'home_team_id') THEN
    ALTER TABLE matches ADD COLUMN home_team_id uuid REFERENCES teams(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'matches' AND column_name = 'away_team_id') THEN
    ALTER TABLE matches ADD COLUMN away_team_id uuid REFERENCES teams(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'matches' AND column_name = 'home_score') THEN
    ALTER TABLE matches ADD COLUMN home_score int DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'matches' AND column_name = 'away_score') THEN
    ALTER TABLE matches ADD COLUMN away_score int DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'matches' AND column_name = 'match_date') THEN
    ALTER TABLE matches ADD COLUMN match_date timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'matches' AND column_name = 'round') THEN
    ALTER TABLE matches ADD COLUMN round int;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'matches' AND column_name = 'stage') THEN
    ALTER TABLE matches ADD COLUMN stage text DEFAULT 'group';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'matches' AND column_name = 'status') THEN
    ALTER TABLE matches ADD COLUMN status text DEFAULT 'scheduled';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'matches' AND column_name = 'created_at') THEN
    ALTER TABLE matches ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;
END
$$;

-- 3. Create goals table
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  minute int NOT NULL,
  is_own_goal boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 4. Create cards table
CREATE TABLE IF NOT EXISTS cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  card_type text NOT NULL CHECK (card_type IN ('YELLOW', 'RED')),
  minute int NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 5. Create indexes
CREATE INDEX IF NOT EXISTS idx_goals_match_id ON goals(match_id);
CREATE INDEX IF NOT EXISTS idx_goals_player_id ON goals(player_id);
CREATE INDEX IF NOT EXISTS idx_cards_match_id ON cards(match_id);
CREATE INDEX IF NOT EXISTS idx_cards_player_id ON cards(player_id);
CREATE INDEX IF NOT EXISTS idx_matches_stage ON matches(stage);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_players_team_id ON players(team_id);

-- 6. RLS Policies

-- Enable RLS on all tables
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Teams: anon read, authenticated write
CREATE POLICY IF NOT EXISTS "teams_anon_read" ON teams FOR SELECT TO anon USING (true);
CREATE POLICY IF NOT EXISTS "teams_auth_read" ON teams FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "teams_auth_insert" ON teams FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "teams_auth_update" ON teams FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "teams_auth_delete" ON teams FOR DELETE TO authenticated USING (true);

-- Matches: anon read, authenticated write
CREATE POLICY IF NOT EXISTS "matches_anon_read" ON matches FOR SELECT TO anon USING (true);
CREATE POLICY IF NOT EXISTS "matches_auth_read" ON matches FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "matches_auth_insert" ON matches FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "matches_auth_update" ON matches FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "matches_auth_delete" ON matches FOR DELETE TO authenticated USING (true);

-- Goals: anon read, authenticated write
CREATE POLICY IF NOT EXISTS "goals_anon_read" ON goals FOR SELECT TO anon USING (true);
CREATE POLICY IF NOT EXISTS "goals_auth_read" ON goals FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "goals_auth_insert" ON goals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "goals_auth_update" ON goals FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "goals_auth_delete" ON goals FOR DELETE TO authenticated USING (true);

-- Cards: anon read, authenticated write
CREATE POLICY IF NOT EXISTS "cards_anon_read" ON cards FOR SELECT TO anon USING (true);
CREATE POLICY IF NOT EXISTS "cards_auth_read" ON cards FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "cards_auth_insert" ON cards FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "cards_auth_update" ON cards FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "cards_auth_delete" ON cards FOR DELETE TO authenticated USING (true);

-- Players: anon read, authenticated write
CREATE POLICY IF NOT EXISTS "players_anon_read" ON players FOR SELECT TO anon USING (true);
CREATE POLICY IF NOT EXISTS "players_auth_read" ON players FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "players_auth_insert" ON players FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "players_auth_update" ON players FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "players_auth_delete" ON players FOR DELETE TO authenticated USING (true);

-- 7. Create trades table (player transfers between teams)
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

-- Sponsors: if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sponsors') THEN
    ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;
    EXECUTE 'CREATE POLICY IF NOT EXISTS "sponsors_anon_read" ON sponsors FOR SELECT TO anon USING (true)';
    EXECUTE 'CREATE POLICY IF NOT EXISTS "sponsors_auth_read" ON sponsors FOR SELECT TO authenticated USING (true)';
    EXECUTE 'CREATE POLICY IF NOT EXISTS "sponsors_auth_insert" ON sponsors FOR INSERT TO authenticated WITH CHECK (true)';
    EXECUTE 'CREATE POLICY IF NOT EXISTS "sponsors_auth_update" ON sponsors FOR UPDATE TO authenticated USING (true) WITH CHECK (true)';
    EXECUTE 'CREATE POLICY IF NOT EXISTS "sponsors_auth_delete" ON sponsors FOR DELETE TO authenticated USING (true)';
  END IF;
END
$$;
