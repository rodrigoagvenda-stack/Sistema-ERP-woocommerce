# Geezer ERP — Manual do Usuário

> Desenvolvido por **vend.ai** & Grupo Venda
> Todos os direitos reservados

---

## Sumário

1. [Visão Geral](#visão-geral)
2. [Primeiro Acesso](#primeiro-acesso)
3. [Dashboard](#dashboard)
4. [Produtos](#produtos)
5. [Categorias](#categorias)
6. [Marcas](#marcas)
7. [Tags](#tags)
8. [Atributos](#atributos)
9. [Avaliações](#avaliações)
10. [Analytics](#analytics)
    - [Visão Geral](#visão-geral-analytics)
    - [Receita](#receita)
    - [Pedidos](#pedidos)
    - [Produtos Analytics](#produtos-analytics)
    - [Variações](#variações)
    - [Categorias Analytics](#categorias-analytics)
    - [Estoque](#estoque)
    - [Configurações Analytics](#configurações-analytics)
11. [WooCommerce](#woocommerce)
    - [Configurações](#configurações-woocommerce)
    - [Logs de Sincronização](#logs-de-sincronização)
12. [Variáveis de Ambiente](#variáveis-de-ambiente)

---

## Visão Geral

O **Geezer ERP** é um sistema de gestão focado em e-commerce de cerveja artesanal, integrado nativamente ao **WooCommerce**. Permite gerenciar o catálogo de produtos, categorias, marcas, tags, atributos e avaliações, além de oferecer um painel de analytics em tempo real consumindo dados diretamente da sua loja WooCommerce.

**Stack técnica:**
- Frontend: React + TailwindCSS + shadcn/ui
- Backend: Supabase (banco de dados PostgreSQL + Auth + Storage + Edge Functions)
- Integração: WooCommerce REST API v3 via Supabase Edge Function (woo-proxy)
- Deploy: Easypanel (Docker)

---

## Primeiro Acesso

### Login

1. Acesse a URL do sistema
2. Insira seu **e-mail** e **senha** cadastrados no Supabase Authentication
3. Clique em **Entrar**
4. Em caso de erro de credenciais, um alerta vermelho será exibido

> **Como criar um usuário admin:** Acesse o painel do Supabase → Authentication → Users → Invite user. Insira o e-mail e defina a senha.

### Esqueci a senha

Acesse o Supabase Dashboard → Authentication → Users, selecione o usuário e redefina a senha manualmente.

---

## Dashboard

O Dashboard apresenta um resumo rápido do catálogo:

| Card | Descrição |
|------|-----------|
| **Total de Produtos** | Quantidade total de produtos cadastrados |
| **Produtos Ativos** | Produtos com status "Ativo" |
| **Categorias** | Total de categorias |
| **Marcas** | Total de marcas |
| **Tags** | Total de tags |
| **Valor do Estoque** | Soma de (preço × estoque) de todos os produtos |
| **Estoque Baixo** | Produtos abaixo do estoque mínimo (padrão: 5 unidades) |
| **Analytics WooCommerce** | Link direto para o painel de analytics |

---

## Produtos

**Caminho:** Produtos → Produtos

### Listar produtos
A página exibe todos os produtos cadastrados com imagem, nome, categoria, marca, preço, estoque e status.

- **Busca:** Use o campo de pesquisa para filtrar por nome ou descrição
- **Desktop:** Lista em tabela
- **Mobile:** Lista em cards com foto, preço e badges

### Criar produto

1. Clique em **Novo Produto**
2. Preencha os campos:
   - **Nome** *(obrigatório)*
   - **Preço (R$)** *(obrigatório)*
   - **Estoque** — quantidade disponível
   - **Categoria** — selecione da lista
   - **Marca** — selecione da lista
   - **Status** — Ativo ou Inativo
   - **Estoque Mínimo** — alerta de baixo estoque (padrão: 5)
   - **Descrição** — texto livre
   - **Dimensões** — Peso, Largura, Altura, Profundidade (para frete)
3. **Imagem de destaque:** Clique na área amarela e faça upload (qualquer formato → convertido automaticamente para JPEG)
4. **Galeria de imagens:** Após adicionar a imagem principal, surgem slots para imagens adicionais
5. Clique em **Criar Produto**

> **Sobre imagens:** O sistema converte automaticamente qualquer formato (AVIF, PNG, WebP, etc.) para JPEG antes de fazer upload no Supabase Storage, garantindo compatibilidade com o WordPress/WooCommerce.

### Editar produto

1. Clique no ícone de lápis na linha do produto
2. Altere os campos desejados
3. Clique em **Salvar**

### Sincronizar com WooCommerce

1. Clique no ícone **globo** na linha do produto
   - Ícone verde = já sincronizado (tem `woo_id`)
   - Ícone cinza = ainda não sincronizado
2. O sistema envia: nome, preço, descrição, estoque e imagens para o WooCommerce
3. O `woo_id` do produto é salvo localmente após a primeira sincronização
4. Sincronizações futuras fazem `PUT` (atualização) no produto existente

### Excluir produto

1. Clique no ícone de lixeira
2. Confirme na caixa de diálogo

> **Atenção:** Excluir o produto no ERP **não** exclui no WooCommerce. Faça isso manualmente no painel do WooCommerce se necessário.

---

## Categorias

**Caminho:** Produtos → Categorias

### Criar categoria

1. Clique em **Nova Categoria**
2. Preencha:
   - **Nome** *(obrigatório)*
   - **Slug** — gerado automaticamente se vazio
   - **Categoria Pai** — para hierarquia (ex: "Cervejas IPA" filha de "Cervejas")
   - **Status** — Ativo ou Inativo
3. Clique em **Criar**

### Sincronizar com WooCommerce

1. Clique no ícone de globo azul na linha da categoria
2. O sistema cria ou atualiza a categoria no WooCommerce
3. Se a categoria tiver uma "Pai" com `woo_id`, o vínculo hierárquico é replicado no WooCommerce
4. O `woo_id` é salvo localmente após a sincronização

---

## Marcas

**Caminho:** Produtos → Marcas

As marcas são gerenciadas como **atributo global `pa_marca`** no WooCommerce.

### Criar marca

1. Clique em **Nova Marca**
2. Preencha **Nome** e opcionalmente **Slug**
3. Clique em **Criar**

### Sincronizar marca com WooCommerce

1. Clique no ícone de globo azul
2. O sistema:
   - Verifica se o atributo `pa_marca` existe no WooCommerce (cria se não existir)
   - Cria ou atualiza o termo da marca dentro desse atributo
3. O `woo_id` do termo é salvo localmente

---

## Tags

**Caminho:** Produtos → Tags

Tags são etiquetas livres para organizar produtos.

### Criar tag

1. Clique em **Nova Tag**
2. Preencha **Nome** e opcionalmente **Slug**
3. Clique em **Criar**

### Sincronizar tag com WooCommerce

1. Clique no ícone de globo azul
2. O sistema cria ou atualiza a tag em `products/tags` no WooCommerce
3. O `woo_id` é salvo localmente

---

## Atributos

**Caminho:** Produtos → Atributos

Atributos definem características variáveis dos produtos (ex: Volume, Estilo, IBU).

### Criar atributo

1. Clique em **Novo Atributo**
2. Preencha **Nome** e opcionalmente **Slug**
3. Clique em **Criar**

### Gerenciar termos do atributo

Cada atributo pode ter múltiplos termos (ex: Atributo "Volume" → termos "310ml", "500ml", "600ml").

1. Expanda o atributo clicando nele
2. Clique em **Novo Termo**
3. Preencha o nome do termo
4. Clique em **Sincronizar** para enviar ao WooCommerce

---

## Avaliações

**Caminho:** Produtos → Avaliações

As avaliações são **lidas diretamente do WooCommerce** em tempo real — não há cadastro manual.

### Filtros disponíveis

- **Produto:** Filtra avaliações de um produto específico
- **Nota:** Filtra por estrelas (1 a 5)
- **Status:** Aprovada, Pendente, Spam

### Informações exibidas

- Nome do produto
- Avaliador e e-mail
- Nota (1-5 estrelas)
- Data
- Texto da avaliação
- Status (aprovada/pendente)

> As avaliações são **somente leitura** nesta interface. Para moderar, acesse o painel do WooCommerce.

---

## Analytics

Todos os dados de Analytics são consumidos **em tempo real** via WooCommerce REST API, através do proxy seguro (Supabase Edge Function `woo-proxy`).

> **Pré-requisito:** Configure as credenciais WooCommerce em WooCommerce → Configurações antes de usar o Analytics.

---

### Visão Geral Analytics

**Caminho:** Analytics → Visão Geral

Exibe os dados do **mês atual**:

| Métrica | Descrição |
|---------|-----------|
| Receita Total | `total_sales` do WooCommerce |
| Pedidos | `total_orders` do mês |
| Ticket Médio | `average_total_sales` |
| Produtos Vendidos | `total_items` |
| Receita Bruta | `gross_sales` |
| Reembolsos | `total_refunds` |
| Descontos | `total_discount` |
| Frete | `total_shipping` |

---

### Receita

**Caminho:** Analytics → Receita

Gráfico de linha mostrando a evolução da receita no período selecionado.

**Períodos disponíveis:** 7 dias, 30 dias, 90 dias, 1 ano

- **Eixo Y:** Valores em R$ (formato abreviado: R$1.2k)
- **Eixo X:** Datas (formato MM/DD)
- **Tooltip:** Valor exato ao passar o mouse
- **Atualizar:** Botão de refresh manual no canto superior direito

---

### Pedidos

**Caminho:** Analytics → Pedidos

Lista paginada de pedidos do WooCommerce com **atualização automática a cada 30 segundos**.

**Colunas:** Nº do pedido, Cliente, Status, Total, Data

**Status disponíveis:**

| Status | Cor |
|--------|-----|
| Pendente | Amarelo |
| Processando | Azul |
| Em espera | Cinza |
| Concluído | Verde |
| Cancelado | Vermelho |
| Reembolsado | Cinza |
| Falhou | Vermelho |

**Paginação:** 20 pedidos por página, botões Anterior/Próxima.

---

### Produtos Analytics

**Caminho:** Analytics → Produtos

Exibe os produtos mais vendidos (top sellers) com receita por produto.

---

### Variações

**Caminho:** Analytics → Variações

Lista produtos variáveis e suas variações com estoque e receita por variação.

---

### Categorias Analytics

**Caminho:** Analytics → Categorias

Gráfico de pizza mostrando a receita distribuída por categoria (calculado via pedidos + line_items).

---

### Estoque

**Caminho:** Analytics → Estoque

Painel de controle de estoque:
- Produtos em estoque
- Produtos com estoque baixo (abaixo do threshold configurado)
- Produtos zerados

O threshold padrão é configurado em **Analytics → Configurações**.

---

### Configurações Analytics

**Caminho:** Analytics → Configurações

| Campo | Descrição | Padrão |
|-------|-----------|--------|
| Período padrão | Dias usados como padrão nos gráficos | 30 |
| Meta de receita | Valor alvo mensal (R$) | 0 |
| Threshold de estoque baixo | Abaixo deste valor = alerta | 5 |
| Intervalo de sync | Frequência de atualização (minutos) | 10 |

---

## WooCommerce

### Configurações WooCommerce

**Caminho:** WooCommerce → Configurações

Configure a integração com sua loja WooCommerce:

| Campo | Descrição |
|-------|-----------|
| URL da loja | Ex: `https://sualojasite.com.br` |
| Consumer Key | Chave de API do WooCommerce |
| Consumer Secret | Segredo da API do WooCommerce |
| Sync automático de estoque | Sincroniza estoque ao salvar produto |
| Sync automático de preço | Sincroniza preço ao salvar produto |

#### Como obter as credenciais WooCommerce

1. Acesse o painel do WordPress → WooCommerce → Configurações → Avançado → API REST
2. Clique em **Adicionar chave**
3. Descrição: `Geezer ERP`
4. Usuário: selecione um admin
5. Permissões: **Leitura/Escrita**
6. Clique em **Gerar chave de API**
7. Copie o **Consumer Key** e **Consumer Secret** (aparecem apenas uma vez)

#### Testar conexão

Após salvar as credenciais, clique em **Testar Conexão**. O sistema tenta acessar `/system_status` da API WooCommerce e exibe o resultado.

> **Importante:** As credenciais WooCommerce são salvas **no banco de dados** (tabela `marketplace_credentials`), nunca no código-fonte. O frontend nunca vê essas credenciais — elas são usadas apenas pela Edge Function `woo-proxy` no servidor.

---

### Logs de Sincronização

**Caminho:** WooCommerce → Logs de Sync

Exibe o histórico de todas as operações de sincronização com o WooCommerce.

**Colunas:** Operação, Entidade, Status, HTTP, Data

**Filtros:** Por status (Todos, Sucesso, Erro, Pendente)

**Detalhes:** Clique em uma linha com detalhes disponíveis para expandir e ver o payload completo da requisição e resposta.

**Tipos de operação:**

| Código | Descrição |
|--------|-----------|
| `create` | Criação de entidade |
| `update` | Atualização |
| `delete` | Exclusão |
| `sync_stock` | Sincronização de estoque |
| `sync_price` | Sincronização de preço |
| `webhook_received` | Webhook recebido |
| `order_webhook` | Webhook de pedido |

---

## Variáveis de Ambiente

Configure as seguintes variáveis no **Easypanel** (Settings → Environment Variables):

### Obrigatórias

| Variável | Descrição | Onde obter |
|----------|-----------|------------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase | Supabase Dashboard → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Chave anônima pública do Supabase | Supabase Dashboard → Settings → API → anon public |

### Opcionais

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `VITE_WHATSAPP_NUMBER` | Número WhatsApp para atendimento | `5511999999999` |

### Edge Functions (Supabase)

As Edge Functions usam variáveis de ambiente do próprio Supabase (configuradas em Supabase Dashboard → Edge Functions → Secrets):

| Variável | Descrição |
|----------|-----------|
| `SUPABASE_URL` | URL do projeto (automática) |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço (automática) |

> As Edge Functions já recebem `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` automaticamente do ambiente Supabase — não precisa configurar manualmente.

---

## Fluxo de Sincronização WooCommerce

```
Frontend (React)
      │
      │ supabase.functions.invoke('woo-proxy', { endpoint, method, body })
      ▼
Supabase Edge Function: woo-proxy
      │
      │ Busca credenciais na tabela marketplace_credentials
      │ Monta URL: {store_url}/wp-json/wc/v3/{endpoint}?consumer_key=...&consumer_secret=...
      ▼
WooCommerce REST API v3
      │
      ▼
Resposta retornada ao Frontend
```

**Vantagem deste modelo:**
- As credenciais WooCommerce nunca chegam ao navegador do usuário
- Evita erros de CORS (a requisição é feita servidor-a-servidor)
- Uma única Edge Function cobre todas as operações

---

*Geezer ERP © 2025 — Desenvolvido por vend.ai & Grupo Venda*
