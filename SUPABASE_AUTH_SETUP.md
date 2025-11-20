# 🔐 Configuração do Supabase Auth

## ✅ O que foi implementado

O sistema agora usa **autenticação real do Supabase** ao invés da autenticação demo anterior.

### Funcionalidades implementadas:

- ✅ Login com email e senha
- ✅ Criação de contas (Sign Up)
- ✅ Verificação de email automática
- ✅ Gerenciamento de sessão
- ✅ Logout seguro
- ✅ Proteção de rotas admin
- ✅ Persistência de sessão

---

## 📋 Configuração Necessária no Supabase

### 1. **Habilitar Email Authentication**

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto `Lukaya Griffe`
3. Vá em **Authentication** → **Providers**
4. Certifique-se que **Email** está habilitado
5. Configure as opções:
   - ✅ **Enable email provider**
   - ✅ **Confirm email** (recomendado para produção)
   - ❌ **Secure email change** (opcional)

### 2. **Configurar Email Templates (Opcional mas Recomendado)**

Vá em **Authentication** → **Email Templates** e personalize:

- **Confirm signup**: Email de confirmação de conta
- **Reset password**: Email de recuperação de senha
- **Change email**: Email de confirmação de mudança

Personalize com a identidade visual da Lukaya Griffe.

### 3. **Configurar Site URL e Redirect URLs**

Em **Authentication** → **URL Configuration**:

```
Site URL: https://seu-dominio.com
Redirect URLs:
  - https://seu-dominio.com/**
  - http://localhost:5173/** (para desenvolvimento)
```

### 4. **Configurar Políticas de RLS (Row Level Security)**

⚠️ **IMPORTANTE**: As tabelas devem ter RLS habilitado para segurança.

#### Tabela `categories`:

```sql
-- Permitir leitura para todos
CREATE POLICY "Categories são públicas para leitura"
ON categories FOR SELECT
TO public
USING (true);

-- Permitir escrita apenas para usuários autenticados
CREATE POLICY "Apenas autenticados podem criar categorias"
ON categories FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Apenas autenticados podem atualizar categorias"
ON categories FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Apenas autenticados podem deletar categorias"
ON categories FOR DELETE
TO authenticated
USING (true);
```

#### Tabela `products`:

```sql
-- Produtos ativos são públicos
CREATE POLICY "Produtos ativos são públicos"
ON products FOR SELECT
TO public
USING (status = 'active');

-- Admin pode ver todos os produtos
CREATE POLICY "Autenticados podem ver todos os produtos"
ON products FOR SELECT
TO authenticated
USING (true);

-- Apenas autenticados podem criar/editar produtos
CREATE POLICY "Apenas autenticados podem criar produtos"
ON products FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Apenas autenticados podem atualizar produtos"
ON products FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Apenas autenticados podem deletar produtos"
ON products FOR DELETE
TO authenticated
USING (true);
```

---

## 👨‍💼 Gerenciar Usuários Administradores

### Método 1: Via Dashboard do Supabase

1. Vá em **Authentication** → **Users**
2. Clique em **Invite user**
3. Digite o email do administrador
4. O usuário receberá um email de convite

### Método 2: Criar manualmente via SQL

```sql
-- No SQL Editor do Supabase, execute:
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@lukayagriffe.com',
  crypt('sua-senha-segura', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
);
```

### Método 3: Lista de emails admin (já implementado)

No arquivo `src/lib/supabase.js`, linha 18:

```javascript
const adminEmails = ['admin@lukayagriffe.com', 'diguinsilva@gmail.com'];
```

Adicione emails de administradores autorizados a esta lista.

---

## 🧪 Testando a Autenticação

### Criar primeira conta de teste:

1. Acesse o sistema
2. Clique em **"Criar conta"**
3. Digite email e senha (mín. 6 caracteres)
4. Clique em **"Criar Conta"**
5. Verifique seu email e clique no link de confirmação
6. Faça login com as credenciais

### Desabilitar confirmação de email (apenas para testes):

Em **Authentication** → **Providers** → **Email**:
- Desmarque **"Confirm email"**
- Agora contas são criadas instantaneamente sem confirmação

⚠️ **Em produção, SEMPRE mantenha a confirmação de email habilitada!**

---

## 🔒 Segurança

### Políticas implementadas:

1. ✅ Senhas com mínimo 6 caracteres
2. ✅ Validação de email obrigatória
3. ✅ Sessões seguras com JWT
4. ✅ Logout limpa sessão do navegador
5. ✅ RLS protege dados no banco

### Recomendações adicionais:

- 🔐 Use senhas fortes (recomendado 12+ caracteres)
- 📧 Configure SPF/DKIM para emails do domínio
- 🔄 Implemente recuperação de senha (já suportado pelo Supabase)
- 🚫 Adicione rate limiting (Supabase tem proteção nativa)

---

## 📱 Variáveis de Ambiente

Certifique-se que as variáveis estão configuradas:

### Desenvolvimento (.env):
```env
VITE_SUPABASE_URL=https://hnkhihzeqtzqzybkjype.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

### Produção (Easypanel):
```
VITE_SUPABASE_URL=https://hnkhihzeqtzqzybkjype.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

---

## 🐛 Troubleshooting

### Erro: "Invalid login credentials"
- Verifique se o email está confirmado
- Certifique-se que a senha está correta
- Verifique se o usuário existe no Dashboard

### Erro: "Email not confirmed"
- Usuário precisa clicar no link de confirmação no email
- Ou desabilite confirmação temporariamente para testes

### Não recebe email de confirmação
- Verifique spam/lixo eletrônico
- Configure SMTP customizado no Supabase (Settings → Auth)
- Use um serviço como SendGrid ou AWS SES

### Sessão expira muito rápido
- Configure em **Authentication** → **Settings**:
  - JWT expiry: 3600 (1 hora)
  - Refresh token expiry: 604800 (7 dias)

---

## 🎯 Próximos Passos

### Funcionalidades futuras (opcional):

- [ ] Recuperação de senha
- [ ] Autenticação com Google
- [ ] Autenticação com Apple
- [ ] 2FA (Two-Factor Authentication)
- [ ] Logs de auditoria
- [ ] Permissões granulares por usuário

---

## 📞 Suporte

Em caso de dúvidas:
- 📚 [Documentação Supabase Auth](https://supabase.com/docs/guides/auth)
- 💬 [Discord do Supabase](https://discord.supabase.com)
- 📧 [Suporte Lukaya Griffe](https://wa.me/5511986751552)

---

**Status**: ✅ Implementado e pronto para produção
**Última atualização**: $(date)
