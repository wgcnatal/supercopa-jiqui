-- Limpar POTE 6 (remover referência de jogadores que ainda estejam nele)
UPDATE players SET pot = NULL WHERE pot = 'POTE 6';

-- Migrar todos os Volantes para Meia
UPDATE players SET position = 'MEI' WHERE position = 'VOL';
