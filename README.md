# 🛍️ Lukaya Griffe - ERP & Catálogo

Sistema completo de gestão empresarial (ERP) e catálogo online para a Lukaya Griffe. Desenvolvido com React, Vite e TailwindCSS, integrado com Supabase.

## ✨ Funcionalidades

### 📱 Catálogo Público
- **Vitrine de Produtos**: Grid responsivo com imagens, preços e detalhes
- **Filtros Avançados**:
  - Busca por nome
  - Filtro por categoria
  - Filtro por faixa de preço
  - Filtro por tamanho (roupas e calçados)
- **Página de Detalhes**: Visualização completa do produto com galeria
- **Carrinho de Compras**: Gerenciamento de itens com persistência local
- **Integração WhatsApp**: Envio direto de pedidos
- **Sistema de Tamanhos**: Suporte para roupas (PP-XGG) e calçados (34-45)

### 🔐 Área Administrativa
- **Dashboard**: Métricas e estatísticas em tempo real
  - Total de produtos
  - Produtos ativos/inativos
  - Valor total do inventário
  - Visualizações de produtos
- **Gestão de Produtos**:
  - CRUD completo (criar, ler, atualizar, deletar)
  - Upload de imagens
  - Gerenciamento de tamanhos disponíveis
  - Controle de status (ativo/inativo)
  - Formatação automática de preços em BRL
- **Gestão de Categorias**:
  - CRUD de categorias
  - Tipos de tamanho (roupas/calçados)
  - Controle de status

### 🎨 Interface
- **Design Responsivo**: Funciona perfeitamente em desktop, tablet e mobile
- **Tema Amarelo/Dourado**: Identidade visual da marca Lukaya Griffe
- **Animações Suaves**: Transições e hover effects
- **Sidebar Colapsável**: Otimização de espaço no admin

## 🚀 Tecnologias Utilizadas

- **React 18**: Framework JavaScript para UI
- **Vite**: Build tool e dev server ultra-rápido
- **TailwindCSS**: Framework CSS utility-first
- **Lucide React**: Biblioteca de ícones moderna
- **Supabase**: Backend-as-a-Service (Database + API)

## 📦 Instalação

### Pré-requisitos
- Node.js 16+ instalado
- npm ou yarn
- Conta no Supabase (ou configurar backend próprio)

### Passo a Passo

1. **Clone o repositório**
```bash
git clone <url-do-repositorio>
cd Codigin
```

2. **Instale as dependências**
```bash
npm install
# ou
yarn install
```

3. **Configure o Supabase**

   Edite o arquivo `src/App.jsx` e atualize as credenciais:
   ```javascript
   const SUPABASE_URL = 'sua-url-do-supabase';
   const SUPABASE_ANON_KEY = 'sua-chave-anonima';
   ```

4. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
# ou
yarn dev
```

5. **Acesse a aplicação**

   Abra o navegador em `http://localhost:3000`

## 🗄️ Estrutura do Banco de Dados

### Tabela: `products`
```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category_id INTEGER REFERENCES categories(id),
  image_urls TEXT,
  views INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  available_sizes TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Tabela: `categories`
```sql
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  size_type TEXT, -- 'clothing' ou 'footwear'
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 📱 Como Usar

### Catálogo (Modo Público)

1. **Navegar Produtos**: Visualize todos os produtos disponíveis
2. **Filtrar**: Use os filtros laterais para refinar sua busca
3. **Ver Detalhes**: Clique em um produto para ver detalhes completos
4. **Adicionar ao Carrinho**: Selecione tamanho e quantidade
5. **Finalizar Pedido**: Envie seu pedido via WhatsApp

### Admin (Modo Administrativo)

1. **Login**: Clique em "Admin" e faça login (demo: qualquer email/senha 6+ caracteres)
2. **Dashboard**: Visualize métricas do negócio
3. **Gerenciar Produtos**:
   - Clique em "Produtos" no menu lateral
   - Use "Novo Produto" para adicionar
   - Clique nos ícones de editar/deletar para gerenciar
4. **Gerenciar Categorias**:
   - Clique em "Categorias" no menu lateral
   - Adicione categorias e defina tipos de tamanho

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build de produção
npm run preview

# Lint do código
npm run lint
```

## 🌐 Deploy

### Vercel (Recomendado)

1. Instale o Vercel CLI:
```bash
npm i -g vercel
```

2. Faça deploy:
```bash
vercel
```

### Netlify

1. Build o projeto:
```bash
npm run build
```

2. Faça deploy da pasta `dist/` no Netlify

### Outros Provedores

O projeto gera uma pasta `dist/` após o build que pode ser hospedada em qualquer servidor de arquivos estáticos.

## 🔒 Segurança

**IMPORTANTE**: Este projeto usa autenticação demo simplificada. Para produção:

1. Implemente autenticação real (Supabase Auth, Firebase Auth, etc.)
2. Configure Row Level Security (RLS) no Supabase
3. Não exponha chaves de API sensíveis no código frontend
4. Use variáveis de ambiente para configurações

## 🎨 Personalização

### Cores

Edite o arquivo `tailwind.config.js` para alterar o tema de cores:

```javascript
theme: {
  extend: {
    colors: {
      'lukaya-yellow': {
        // Suas cores aqui
      }
    }
  }
}
```

### Número do WhatsApp

Edite em `src/App.jsx`:
```javascript
const whatsappNumber = '5511986751552'; // Seu número aqui
```

## 📝 Roadmap de Melhorias

### Funcionalidades Sugeridas

1. **Autenticação Real**
   - Integração com Supabase Auth
   - Múltiplos níveis de acesso
   - Reset de senha

2. **Imagens**
   - Upload para Supabase Storage
   - Múltiplas imagens por produto
   - Galeria com zoom

3. **Pedidos**
   - Histórico de pedidos
   - Status de pedidos
   - Notificações

4. **Analytics**
   - Google Analytics
   - Rastreamento de conversões
   - Relatórios de vendas

5. **SEO**
   - Meta tags dinâmicas
   - Sitemap
   - Open Graph tags

6. **Performance**
   - Lazy loading de imagens
   - Code splitting
   - PWA (Progressive Web App)

7. **Checkout**
   - Integração com gateway de pagamento
   - Cálculo de frete
   - Cupons de desconto

## 🐛 Problemas Conhecidos

- Imagens são armazenadas como base64 (para produção, usar Supabase Storage)
- Autenticação é simplificada (implementar auth real para produção)
- Sem paginação (adicionar quando houver muitos produtos)

## 📄 Licença

Este projeto é propriedade da Lukaya Griffe. Todos os direitos reservados.

## 👥 Suporte

Para dúvidas ou suporte:
- WhatsApp: (11) 98675-1552
- Email: contato@lukayagriffe.com.br

---

Desenvolvido com ❤️ para Lukaya Griffe
