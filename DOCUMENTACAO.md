# Vend.ai — Documentação do Sistema

## O que é

Plataforma SaaS multi-tenant de gestão WooCommerce. Cada empresa (tenant) tem seu próprio painel administrativo com URL personalizada, identidade visual dinâmica e acesso isolado aos dados.

Acesso em produção: **crud.vendai.pro**

---

## Empresas ativas

| Empresa | Slug | URL de acesso |
|---|---|---|
| Geezer (cervejaria) | `geezer` | crud.vendai.pro/login/geezer |
| VendAgro (agronegócio) | `agro` | crud.vendai.pro/login/agro |

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + Vite |
| Estilo | Tailwind CSS + Radix UI |
| Backend / Auth | Supabase (PostgreSQL + Auth + Storage) |
| Edge Functions | Deno (Supabase Functions) |
| Marketplace | WooCommerce REST API v3 |
| Deploy | Docker + Nginx + Easypanel |

---

## Arquitetura geral

```
Browser
  └── React SPA (Vite build)
        ├── Supabase JS SDK  →  Supabase Cloud (SA-EAST-1, São Paulo)
        │     ├── Auth (login/sessão)
        │     ├── Database (PostgreSQL + RLS)
        │     └── Storage (imagens: product-images, company-assets)
        └── Edge Functions (Deno)
              ├── woo-proxy          → WooCommerce REST API
              ├── sync-to-marketplaces
              ├── marketplace-webhook
              ├── test-marketplace-connection
              └── update-marketplace-stock
```

---

## Estrutura de pastas

```
src/
├── App.jsx                  # Roteamento principal
├── main.jsx                 # Entry point React
├── config/
│   └── env.js               # Leitura de variáveis de ambiente (dev + Docker)
├── context/
│   └── CompanyContext.jsx   # Contexto global da empresa (branding, features)
├── hooks/
│   └── useHealthCheck.js    # Health check periódico (Supabase + WooCommerce)
├── lib/
│   ├── supabase.js          # Cliente Supabase + helpers de auth
│   ├── company.js           # Cache e carregamento da empresa atual
│   ├── api.js               # Todas as queries ao banco + wooProxy
│   └── utils.js             # Helper cn() para classes CSS
├── components/
│   ├── layout/
│   │   ├── AdminLayout.jsx        # Layout do painel admin (sidebar + header)
│   │   ├── SuperAdminLayout.jsx   # Layout super-admin
│   │   ├── ProtectedRoute.jsx     # Guarda de rota (requer login)
│   │   ├── SuperAdminRoute.jsx    # Guarda de rota (requer super-admin)
│   │   └── HealthBanner.jsx       # Banner de indisponibilidade automático
│   └── ui/                        # Componentes Radix UI (button, input, dialog…)
└── pages/
    ├── Login.jsx                  # Login por slug da empresa
    ├── super-admin/
    │   ├── Login.jsx              # Login super-admin
    │   ├── Companies.jsx          # Lista de empresas
    │   └── CompanyEditor.jsx      # Criar/editar empresa
    └── admin/
        ├── Dashboard.jsx
        ├── Products.jsx
        ├── Categories.jsx
        ├── Brands.jsx
        ├── Tags.jsx
        ├── Attributes.jsx
        ├── Reviews.jsx
        ├── Coupons.jsx
        ├── FAQ.jsx
        ├── NossasCervejas.jsx     # Feature exclusiva Geezer
        ├── WooSettings.jsx
        ├── WooPayments.jsx
        ├── WooShipping.jsx
        ├── SyncLogs.jsx
        └── analytics/
            ├── Overview.jsx
            ├── Revenue.jsx
            ├── Orders.jsx
            ├── ProductsAnalytics.jsx
            ├── CategoriesAnalytics.jsx
            ├── Variations.jsx
            ├── Stock.jsx
            └── AnalyticsSettings.jsx

supabase/
└── functions/
    ├── woo-proxy/                 # Proxy para WooCommerce + upload de mídia
    ├── sync-to-marketplaces/      # Sync de produtos para o WooCommerce
    ├── marketplace-webhook/       # Recebe webhooks do WooCommerce
    ├── test-marketplace-connection/
    └── update-marketplace-stock/
```

---

## Multi-tenancy

Cada empresa é isolada pelo campo `company_id` em todas as tabelas do banco. O Supabase RLS (Row Level Security) garante que um usuário só acessa dados da sua própria empresa.

**Fluxo de login:**
1. Usuário acessa `/login/:slug`
2. Autentica via Supabase Auth
3. Sistema busca o perfil → pega o `company_id` → carrega a empresa
4. Redireciona para `/admin/:slug/dashboard`
5. `CompanyContext` aplica a identidade visual (`--brand`, favicon, título)

---

## Identidade visual dinâmica

Cada empresa tem:
- `primary_color` — define a variável CSS `--brand` em todo o sistema
- `logo_url` — exibida no sidebar
- `favicon_url` — ícone da aba do navegador
- `name` — título da aba

Quando o usuário faz login, o `CompanyContext` aplica tudo isso automaticamente via `document.documentElement.style.setProperty('--brand', color)`.

**Rotas `/super-admin/*` são excluídas** do branding da empresa — usam identidade da Vend.ai.

---

## Feature flags

Cada empresa pode ter funcionalidades habilitadas/desabilitadas individualmente:

| Flag | Descrição |
|---|---|
| `feature_payments` | Formas de pagamento WooCommerce |
| `feature_shipping` | Frete WooCommerce |
| `feature_coupons` | Cupons de desconto |
| `feature_site` | Funcionalidades de site (ex: Nossas Cervejas — exclusivo Geezer) |
| `has_woocommerce` | Integração WooCommerce ativa |

---

## Integração WooCommerce

As credenciais (`store_url`, `consumer_key`, `consumer_secret`) ficam na tabela `marketplace_credentials`, isoladas por `company_id`.

Todas as chamadas passam pela edge function **`woo-proxy`**, que:
1. Busca as credenciais no banco pelo `company_id` da sessão
2. Monta a URL autenticada (`/wp-json/wc/v3/...?consumer_key=...`)
3. Executa a requisição server-side (evita expor credenciais no browser)
4. Retorna o resultado para o frontend

**Upload de imagem para WooCommerce:**
O `woo-proxy` também suporta `action: 'upload_media'`:
1. Baixa a imagem do Supabase Storage
2. Faz upload para `/wp-json/wp/v2/media` com Basic Auth
3. Retorna o `id` do attachment do WordPress
4. A imagem é referenciada pelo ID (não por URL externa)

---

## Storage (imagens)

| Bucket | Uso |
|---|---|
| `product-images` | Imagens de produtos e categorias |
| `company-assets` | Logo e favicon das empresas |

Todas as imagens são convertidas para **JPEG** antes do upload (via canvas) para garantir compatibilidade com o WordPress/WooCommerce.

---

## Health Check

O hook `useHealthCheck` verifica a cada 30 segundos:
- **Supabase** — tenta acessar o endpoint REST
- **WooCommerce** — chama a edge function (apenas se `has_woocommerce = true`)

Se algum serviço cair, o `HealthBanner` aparece automaticamente no topo do painel com a mensagem:

> *"Sistema temporariamente indisponível — instabilidade no provedor de infraestrutura. Monitorando e avisaremos quando normalizar."*

Some automaticamente quando o serviço voltar.

---

## Variáveis de ambiente

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_WHATSAPP_NUMBER=5511999999999   # opcional
```

Em produção (Docker/Easypanel), são injetadas em runtime via `window._env_` pelo `docker-entrypoint.sh` — sem necessidade de rebuild da imagem.

---

## Deploy

O projeto usa um **Dockerfile multi-stage**:

1. **Stage 1 (builder)** — Node 18-alpine, instala dependências e roda `npm run build`
2. **Stage 2 (servidor)** — Nginx alpine serve os arquivos estáticos da pasta `dist/`

O `docker-entrypoint.sh` gera o arquivo `/env-config.js` em runtime com as variáveis do Easypanel antes de iniciar o Nginx.

Hospedado no **Easypanel** (Turbo Cloud). Deploy automático via push no branch `claude/migrate-lucaya-griffe-01S4vtijouGPHCAUgDAMJPe2`.

---

## Super Admin

Acesso em: `crud.vendai.pro/super-admin/login`

Funcionalidades:
- Listar todas as empresas
- Criar nova empresa (com upload de logo/favicon, cor da marca, slug, features)
- Editar empresa existente
- Copiar URL de acesso da empresa
- Ativar/desativar integração WooCommerce por empresa

O super-admin é identificado pelo campo `is_super_admin = true` na tabela `profiles`.

---

## Banco de dados (principais tabelas)

| Tabela | Descrição |
|---|---|
| `companies` | Empresas cadastradas (branding, features, slug) |
| `profiles` | Usuários com vínculo a uma empresa (`company_id`) |
| `products` | Produtos com preço, estoque, imagens, woo_id |
| `categories` | Categorias de produto com hierarquia e imagem |
| `brands` | Marcas dos produtos |
| `tags` | Tags para taxonomia |
| `attributes` | Atributos de variação (ex: tamanho, cor) |
| `attribute_terms` | Valores dos atributos |
| `reviews` | Avaliações de clientes |
| `coupons` | Cupons de desconto |
| `marketplace_credentials` | Credenciais WooCommerce por empresa |
| `marketplace_sync_log` | Histórico de sincronizações |
| `analytics_settings` | Configurações de analytics por empresa |

RLS ativo em todas as tabelas — usuário só acessa dados do seu `company_id`.

---

## Dependências principais

| Pacote | Versão | Uso |
|---|---|---|
| react | 18.2.0 | UI |
| react-router-dom | 7.13.0 | Roteamento |
| @supabase/supabase-js | 2.83.0 | Backend |
| tailwindcss | 3.3.6 | Estilo |
| recharts | 3.7.0 | Gráficos |
| lucide-react | 0.294.0 | Ícones |
| @radix-ui/* | — | Componentes acessíveis |
| class-variance-authority | 0.7.1 | Variantes de componentes |

---

## Considerações importantes

- **Supabase região SA-EAST-1 (São Paulo)** — qualquer instabilidade da Supabase nessa região afeta o sistema inteiro (auth, banco, storage, edge functions)
- **WooCommerce** requer que o servidor WordPress permita Basic Auth para upload de mídia
- **Imagens** devem ser convertidas para JPEG antes do upload para garantir compatibilidade com o WordPress
- **Cache de empresa** é mantido em memória no módulo `company.js` — limpo automaticamente no logout ou troca de usuário
