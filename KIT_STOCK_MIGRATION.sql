-- Adiciona controle de estoque na tabela kits
ALTER TABLE kits ADD COLUMN IF NOT EXISTS stock_qty INTEGER DEFAULT NULL;
