# ⚡ Início Rápido - Lukaya Griffe

Guia para ter o sistema rodando em **menos de 10 minutos**!

## 🚀 Setup Rápido (5 minutos)

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Supabase

**Opção A: Usar o Supabase já configurado (Demo)**
- O código já vem com credenciais de demo
- Pule para o passo 3!

**Opção B: Configurar seu próprio Supabase**

1. Crie conta em [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Execute o SQL em `DADOS_EXEMPLO.sql` no SQL Editor
4. Copie suas credenciais:
   - Project URL
   - Anon/Public Key
5. Edite `src/App.jsx` linhas 4-5 com suas credenciais

### 3. Rodar o Projeto
```bash
npm run dev
```

Pronto! Acesse http://localhost:3000 🎉

## 📱 Primeiro Uso

### Acessar o Catálogo
1. Abra http://localhost:3000
2. Você verá o catálogo público
3. Teste os filtros e busca
4. Adicione produtos ao carrinho
5. Clique em "Finalizar pelo WhatsApp"

### Acessar o Admin
1. Clique em "Admin" no topo
2. Use qualquer email e senha com 6+ caracteres
3. Exemplo:
   - Email: `admin@lukaya.com`
   - Senha: `123456`
4. Explore:
   - Dashboard com métricas
   - Gestão de Produtos
   - Gestão de Categorias

## 🎯 Casos de Uso Comuns

### Adicionar um Produto

1. Vá em Admin → Produtos
2. Clique em "Novo Produto"
3. Preencha:
   - Nome: "Sandália Nova"
   - Preço: R$ 149,90
   - Descrição: "Linda sandália..."
   - Categoria: Sandálias Femininas
   - Selecione os tamanhos disponíveis
4. Faça upload de uma imagem (ou deixe o placeholder)
5. Clique em "Cadastrar"

### Criar uma Categoria

1. Vá em Admin → Categorias
2. Clique em "Nova Categoria"
3. Preencha:
   - Nome: "Tênis"
   - Tipo: Calçados
4. Clique em "Cadastrar"

### Filtrar Produtos por Tamanho

1. No catálogo, clique em "Filtrar por Tamanho"
2. Selecione uma categoria (ex: Sandálias)
3. Escolha um tamanho (ex: 38)
4. Veja apenas produtos com aquele tamanho!

### Fazer um Pedido

1. Navegue pelo catálogo
2. Clique em um produto
3. Selecione tamanho e quantidade
4. Clique em "Adicionar ao Carrinho"
5. Clique no ícone do carrinho (topo direito)
6. Revise seu pedido
7. Clique em "Finalizar pelo WhatsApp"
8. Mensagem formatada será aberta no WhatsApp!

## 🔧 Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor de dev

# Build
npm run build            # Cria build de produção
npm run preview          # Preview da build

# Qualidade
npm run lint             # Verifica código
```

## 📁 Estrutura de Arquivos

```
Codigin/
├── src/
│   ├── App.jsx          # ⭐ Componente principal (tudo está aqui)
│   ├── main.jsx         # Ponto de entrada
│   └── index.css        # Estilos Tailwind
├── public/              # Arquivos públicos
├── index.html           # HTML principal
├── package.json         # Dependências
├── vite.config.js       # Config do Vite
├── tailwind.config.js   # Config do Tailwind
├── README.md            # 📖 Documentação completa
├── MELHORIAS.md         # 💡 Sugestões de melhorias
├── DEPLOY.md            # 🚀 Guia de deploy
└── DADOS_EXEMPLO.sql    # 🗄️ Dados de exemplo
```

## 🎨 Personalização Rápida

### Mudar Cores do Tema

Edite `tailwind.config.js`:
```javascript
theme: {
  extend: {
    colors: {
      'lukaya-yellow': {
        500: '#eab308', // Mude para sua cor!
      }
    }
  }
}
```

### Mudar Número do WhatsApp

Edite `src/App.jsx` linha ~268:
```javascript
const whatsappNumber = '5577999838660'; // Seu número aqui!
```

### Mudar Nome da Loja

1. `index.html` - Tag `<title>`
2. `src/App.jsx` - Componentes de header
3. `package.json` - Campo `name`

## 🐛 Problemas Comuns

### "Module not found"
```bash
rm -rf node_modules package-lock.json
npm install
```

### Porta 3000 ocupada
```bash
# Mude a porta no vite.config.js
server: {
  port: 3001
}
```

### Imagens não aparecem
- Verifique se a URL da imagem é válida
- Use URLs do Unsplash para testes
- Ou faça upload de imagens locais (convertidas para base64)

### Supabase não conecta
- Verifique se as credenciais estão corretas
- Teste se o projeto Supabase está ativo
- Veja logs do console do navegador (F12)

## 📚 Próximos Passos

1. ✅ Sistema funcionando local
2. 📖 Leia o [README.md](README.md) completo
3. 💡 Veja sugestões em [MELHORIAS.md](MELHORIAS.md)
4. 🚀 Aprenda a fazer deploy em [DEPLOY.md](DEPLOY.md)
5. 🎨 Personalize a interface ao seu gosto
6. 🔒 Implemente segurança real antes de produção

## 💬 Suporte

**Dúvidas?** Abra uma issue ou entre em contato:
- 📱 WhatsApp: (77) 99983-8660
- 📧 Email: contato@lukayagriffe.com.br

## 🎉 Dicas Extras

### Atalhos do Teclado
- `Ctrl/Cmd + K` - Abrir busca (não implementado ainda)
- `Esc` - Fechar modais

### Dados de Teste
Use o arquivo `DADOS_EXEMPLO.sql` para popular o banco com:
- 8 categorias
- 25+ produtos de exemplo
- Imagens do Unsplash

### Performance
- Imagens do Unsplash são otimizadas automaticamente
- LocalStorage salva carrinho mesmo após recarregar
- Filtros são aplicados em tempo real

### Mobile
- Interface 100% responsiva
- Teste em: Chrome DevTools > Toggle Device Toolbar
- Ou acesse de seu celular na mesma rede

---

**Pronto para começar! 🚀**

Se algo não funcionar, verifique:
1. Node.js 16+ instalado? (`node -v`)
2. Dependências instaladas? (`npm install`)
3. Servidor rodando? (`npm run dev`)
4. Console sem erros? (F12 no navegador)
