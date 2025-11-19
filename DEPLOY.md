# 🚀 Guia Completo de Deploy - Lukaya Griffe

## 📋 Pré-requisitos

Antes de fazer o deploy, certifique-se de:

- ✅ Ter uma conta no Supabase configurada
- ✅ Banco de dados criado e populado
- ✅ Código testado localmente
- ✅ Variáveis de ambiente configuradas

## 🗄️ Configuração do Supabase

### 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Clique em "New Project"
3. Preencha as informações:
   - Nome: lukaya-griffe
   - Database Password: (senha segura)
   - Region: South America (São Paulo)

### 2. Criar Tabelas

Execute os seguintes SQL no Supabase SQL Editor:

```sql
-- Tabela de Categorias
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  size_type TEXT CHECK (size_type IN ('clothing', 'footwear')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Produtos
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  image_urls TEXT,
  views INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  available_sizes TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_categories_status ON categories(status);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at BEFORE UPDATE
ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE
ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 3. Configurar Row Level Security (RLS)

```sql
-- Habilitar RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Políticas para produtos (todos podem ler produtos ativos)
CREATE POLICY "Anyone can view active products"
ON products FOR SELECT
USING (status = 'active');

-- Políticas para categorias (todos podem ler categorias ativas)
CREATE POLICY "Anyone can view active categories"
ON categories FOR SELECT
USING (status = 'active');

-- Para desenvolvimento/demo, permitir todas as operações
-- REMOVER EM PRODUÇÃO e implementar auth real
CREATE POLICY "Allow all for now"
ON products FOR ALL
USING (true);

CREATE POLICY "Allow all for now"
ON categories FOR ALL
USING (true);
```

### 4. Configurar Storage (Para imagens)

1. No Supabase Dashboard, vá em Storage
2. Crie um novo bucket: `product-images`
3. Configure como público:

```sql
-- Política de leitura pública para imagens
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'product-images' );

-- Política de upload (ajustar conforme auth)
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'product-images' );
```

### 5. Dados Iniciais

```sql
-- Inserir categorias iniciais
INSERT INTO categories (name, size_type) VALUES
  ('Sandálias', 'footwear'),
  ('Chinelos', 'footwear'),
  ('Rasteirinhas', 'footwear'),
  ('Bolsas', null),
  ('Acessórios', null);

-- Inserir produtos de exemplo
INSERT INTO products (name, description, price, category_id, image_urls, available_sizes) VALUES
  (
    'Sandália Rakka Ultra',
    'Sandália ultra confortável com design moderno e elegante.',
    149.90,
    1,
    'https://via.placeholder.com/400',
    ARRAY['36', '37', '38', '39', '40']
  );
```

## 🌐 Deploy em Plataformas

### Opção 1: Vercel (Recomendado)

#### Vantagens
- ✅ Deploy automático do GitHub
- ✅ SSL gratuito
- ✅ CDN global
- ✅ Fácil configuração

#### Passo a Passo

1. **Instalar Vercel CLI**
```bash
npm install -g vercel
```

2. **Login**
```bash
vercel login
```

3. **Deploy**
```bash
vercel
```

4. **Configurar Variáveis de Ambiente**

No dashboard da Vercel:
- Settings → Environment Variables
- Adicionar:
  ```
  VITE_SUPABASE_URL=https://seu-projeto.supabase.co
  VITE_SUPABASE_ANON_KEY=sua-chave-aqui
  ```

5. **Deploy de Produção**
```bash
vercel --prod
```

#### Configuração Adicional

Criar `vercel.json`:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### Opção 2: Netlify

#### Passo a Passo

1. **Build local**
```bash
npm run build
```

2. **Instalar Netlify CLI**
```bash
npm install -g netlify-cli
```

3. **Login**
```bash
netlify login
```

4. **Deploy**
```bash
netlify deploy
```

5. **Deploy de produção**
```bash
netlify deploy --prod
```

#### Configuração

Criar `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
```

### Opção 3: GitHub Pages

#### Passo a Passo

1. **Instalar gh-pages**
```bash
npm install -D gh-pages
```

2. **Adicionar scripts ao package.json**
```json
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

3. **Configurar base no vite.config.js**
```javascript
export default defineConfig({
  base: '/nome-do-repo/',
  plugins: [react()]
})
```

4. **Deploy**
```bash
npm run deploy
```

### Opção 4: Cloudflare Pages

1. Acesse [pages.cloudflare.com](https://pages.cloudflare.com)
2. Conecte seu repositório GitHub
3. Configure:
   - Build command: `npm run build`
   - Build output: `dist`
   - Root directory: `/`
4. Adicione variáveis de ambiente
5. Deploy automático!

## 🔐 Segurança em Produção

### 1. Variáveis de Ambiente

**Nunca** commite o arquivo `.env`!

**.env.example**
```bash
VITE_SUPABASE_URL=sua_url_aqui
VITE_SUPABASE_ANON_KEY=sua_chave_aqui
VITE_WHATSAPP_NUMBER=5511986751552
```

### 2. Atualizar Código para Usar Env Vars

**src/config/supabase.js**
```javascript
export const supabaseConfig = {
  url: import.meta.env.VITE_SUPABASE_URL,
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY
}

if (!supabaseConfig.url || !supabaseConfig.anonKey) {
  throw new Error('Missing Supabase environment variables')
}
```

### 3. Headers de Segurança

Adicione no Vercel/Netlify:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    }
  ]
}
```

## 📊 Monitoramento

### Google Analytics

1. **Criar propriedade no GA4**

2. **Adicionar ao index.html**
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Sentry (Error Tracking)

1. **Instalar Sentry**
```bash
npm install @sentry/react
```

2. **Configurar**
```javascript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay()
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

## ✅ Checklist Pré-Deploy

- [ ] Testes passando localmente
- [ ] Build funcionando sem erros
- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados populado
- [ ] RLS configurado no Supabase
- [ ] Imagens otimizadas
- [ ] SEO configurado (meta tags)
- [ ] Analytics configurado
- [ ] Domínio personalizado configurado
- [ ] SSL ativado
- [ ] Headers de segurança configurados
- [ ] Backup do banco de dados criado

## 🔄 CI/CD com GitHub Actions

Criar `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'

    - name: Install dependencies
      run: npm ci

    - name: Run tests
      run: npm test

    - name: Build
      run: npm run build
      env:
        VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
        VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}

    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
```

## 🌍 Domínio Personalizado

### Vercel

1. Vá em Settings → Domains
2. Adicione seu domínio: `lukayagriffe.com.br`
3. Configure DNS conforme instruções

### Cloudflare (Recomendado para DNS)

1. Adicione o domínio ao Cloudflare
2. Configure nameservers
3. Ative proxy (nuvem laranja)
4. Configure SSL/TLS: Full (strict)

## 📱 PWA Deploy

Após configurar PWA:

1. Verifique com Lighthouse
2. Teste em múltiplos dispositivos
3. Configure ícones e splash screens
4. Teste instalação no mobile

## 🐛 Troubleshooting

### Build falha

```bash
# Limpar cache
rm -rf node_modules package-lock.json
npm install

# Limpar dist
rm -rf dist
npm run build
```

### Variáveis de ambiente não funcionam

- Certifique-se de usar prefixo `VITE_`
- Reinicie o servidor após mudanças
- Verifique se estão configuradas na plataforma

### 404 em rotas

Adicione configuração de rewrite (veja cada plataforma acima)

### CORS errors

Configure headers CORS no Supabase ou use proxy

## 📞 Suporte

Em caso de dúvidas:
- 📧 Email: suporte@lukayagriffe.com.br
- 💬 WhatsApp: (11) 98675-1552

---

✅ Após seguir este guia, seu sistema estará rodando em produção com segurança e performance otimizadas!
