-- 004: adiciona email na tabela profiles para facilitar listagem de usuários
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
