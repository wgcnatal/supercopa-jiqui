-- =============================================
-- SUPERCOPA JIQUI 2026 - Tabela de Jogos
-- Fase de Classificação - Turno Único (7 rodadas)
-- =============================================

-- IDs dos times:
-- Vingadores FC:      e051206b-d595-4872-b9c5-5e58fd008146
-- Seleção do Jiqui:   21fd8d1a-d09e-4aa8-8c99-cf3210eef21c
-- Paçoca FC:          d86b6028-c7a4-49ed-81ee-1f02119fab2a
-- Santos do Jiqui FC: 2d649d32-688a-4e71-840e-f5f4c1dbd5d8
-- Real Madri Jiqui:   dc6adaf5-5317-4f32-bf4c-8d552387f28e
-- Amigos do Jiqui:    557390a0-af76-4625-8edb-c8c00b90efed
-- Ortobom Jiqui FC:   698f14e1-9927-4094-b2bc-5761ed7db30c

-- Limpar jogos existentes (se houver)
DELETE FROM goals;
DELETE FROM cards;
DELETE FROM matches;

-- =============================================
-- 1ª RODADA - 30/07/2026 (Quinta-feira) | Folga: Real Madri Jiqui
-- =============================================
INSERT INTO matches (home_team_id, away_team_id, match_date, round, stage, status) VALUES
('e051206b-d595-4872-b9c5-5e58fd008146', '557390a0-af76-4625-8edb-c8c00b90efed', '2026-07-30T22:30:00Z', 1, 'group', 'scheduled'),
('21fd8d1a-d09e-4aa8-8c99-cf3210eef21c', '698f14e1-9927-4094-b2bc-5761ed7db30c', '2026-07-30T22:30:00Z', 1, 'group', 'scheduled'),
('d86b6028-c7a4-49ed-81ee-1f02119fab2a', '2d649d32-688a-4e71-840e-f5f4c1dbd5d8', '2026-07-30T23:45:00Z', 1, 'group', 'scheduled');

-- =============================================
-- 2ª RODADA - 13/08/2026 (Quinta-feira) | Folga: Ortobom Jiqui FC
-- =============================================
INSERT INTO matches (home_team_id, away_team_id, match_date, round, stage, status) VALUES
('21fd8d1a-d09e-4aa8-8c99-cf3210eef21c', 'd86b6028-c7a4-49ed-81ee-1f02119fab2a', '2026-08-13T22:30:00Z', 2, 'group', 'scheduled'),
('dc6adaf5-5317-4f32-bf4c-8d552387f28e', '557390a0-af76-4625-8edb-c8c00b90efed', '2026-08-13T22:30:00Z', 2, 'group', 'scheduled'),
('e051206b-d595-4872-b9c5-5e58fd008146', '2d649d32-688a-4e71-840e-f5f4c1dbd5d8', '2026-08-13T23:45:00Z', 2, 'group', 'scheduled');

-- =============================================
-- 3ª RODADA - 27/08/2026 (Quinta-feira) | Folga: Paçoca FC
-- =============================================
INSERT INTO matches (home_team_id, away_team_id, match_date, round, stage, status) VALUES
('e051206b-d595-4872-b9c5-5e58fd008146', '21fd8d1a-d09e-4aa8-8c99-cf3210eef21c', '2026-08-27T22:30:00Z', 3, 'group', 'scheduled'),
('557390a0-af76-4625-8edb-c8c00b90efed', '2d649d32-688a-4e71-840e-f5f4c1dbd5d8', '2026-08-27T22:30:00Z', 3, 'group', 'scheduled'),
('dc6adaf5-5317-4f32-bf4c-8d552387f28e', '698f14e1-9927-4094-b2bc-5761ed7db30c', '2026-08-27T23:45:00Z', 3, 'group', 'scheduled');

-- =============================================
-- 4ª RODADA - 10/09/2026 (Quinta-feira) | Folga: Vingadores FC
-- =============================================
INSERT INTO matches (home_team_id, away_team_id, match_date, round, stage, status) VALUES
('dc6adaf5-5317-4f32-bf4c-8d552387f28e', '2d649d32-688a-4e71-840e-f5f4c1dbd5d8', '2026-09-10T22:30:00Z', 4, 'group', 'scheduled'),
('698f14e1-9927-4094-b2bc-5761ed7db30c', 'd86b6028-c7a4-49ed-81ee-1f02119fab2a', '2026-09-10T22:30:00Z', 4, 'group', 'scheduled'),
('557390a0-af76-4625-8edb-c8c00b90efed', '21fd8d1a-d09e-4aa8-8c99-cf3210eef21c', '2026-09-10T23:45:00Z', 4, 'group', 'scheduled');

-- =============================================
-- 5ª RODADA - 24/09/2026 (Quinta-feira) | Folga: Amigos do Jiqui
-- =============================================
INSERT INTO matches (home_team_id, away_team_id, match_date, round, stage, status) VALUES
('dc6adaf5-5317-4f32-bf4c-8d552387f28e', 'd86b6028-c7a4-49ed-81ee-1f02119fab2a', '2026-09-24T22:30:00Z', 5, 'group', 'scheduled'),
('2d649d32-688a-4e71-840e-f5f4c1dbd5d8', '21fd8d1a-d09e-4aa8-8c99-cf3210eef21c', '2026-09-24T22:30:00Z', 5, 'group', 'scheduled'),
('698f14e1-9927-4094-b2bc-5761ed7db30c', 'e051206b-d595-4872-b9c5-5e58fd008146', '2026-09-24T23:45:00Z', 5, 'group', 'scheduled');

-- =============================================
-- 6ª RODADA - 08/10/2026 (Quinta-feira) | Folga: Santos do Jiqui FC
-- =============================================
INSERT INTO matches (home_team_id, away_team_id, match_date, round, stage, status) VALUES
('698f14e1-9927-4094-b2bc-5761ed7db30c', '557390a0-af76-4625-8edb-c8c00b90efed', '2026-10-08T22:30:00Z', 6, 'group', 'scheduled'),
('d86b6028-c7a4-49ed-81ee-1f02119fab2a', 'e051206b-d595-4872-b9c5-5e58fd008146', '2026-10-08T22:30:00Z', 6, 'group', 'scheduled'),
('dc6adaf5-5317-4f32-bf4c-8d552387f28e', '21fd8d1a-d09e-4aa8-8c99-cf3210eef21c', '2026-10-08T23:45:00Z', 6, 'group', 'scheduled');

-- =============================================
-- 7ª RODADA - 22/10/2026 (Quinta-feira) | Folga: Seleção do Jiqui
-- =============================================
INSERT INTO matches (home_team_id, away_team_id, match_date, round, stage, status) VALUES
('2d649d32-688a-4e71-840e-f5f4c1dbd5d8', '698f14e1-9927-4094-b2bc-5761ed7db30c', '2026-10-22T22:30:00Z', 7, 'group', 'scheduled'),
('dc6adaf5-5317-4f32-bf4c-8d552387f28e', 'e051206b-d595-4872-b9c5-5e58fd008146', '2026-10-22T22:30:00Z', 7, 'group', 'scheduled'),
('d86b6028-c7a4-49ed-81ee-1f02119fab2a', '557390a0-af76-4625-8edb-c8c00b90efed', '2026-10-22T23:45:00Z', 7, 'group', 'scheduled');

-- =============================================
-- SEMIFINAIS - 05/11/2026 (Quinta-feira)
-- Serão preenchidas após fase de grupos
-- Semi 1: 1º x 4º - 19h30
-- Semi 2: 2º x 3º - 19h30
-- =============================================

-- =============================================
-- FINAIS - 21/11/2026 (Sábado)
-- 3º e 4º lugar: 16h00
-- Grande Final: 17h30
-- =============================================
