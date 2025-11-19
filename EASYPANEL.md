# 🚀 Deploy no Easypanel - Lukaya Griffe

Guia completo para fazer deploy do sistema Lukaya Griffe no Easypanel em **menos de 5 minutos**!

## 📋 Pré-requisitos

- ✅ Conta no Easypanel ([easypanel.io](https://easypanel.io))
- ✅ Repositório Git configurado (GitHub, GitLab, Bitbucket)
- ✅ Banco de dados Supabase configurado
- ✅ Credenciais do Supabase em mãos

## ⚡ Deploy Rápido (5 minutos)

### 1️⃣ Criar Projeto no Easypanel

1. Acesse seu painel do Easypanel
2. Clique em **"Create Project"** ou **"New Service"**
3. Selecione **"Deploy from GitHub"** (ou sua plataforma Git)
4. Escolha o repositório **Codigin**
5. Configure o branch: `claude/atrio-2025-01HWL3BMw9ffxddmrL5X5qwC` (ou `main`)

### 2️⃣ Configurar Build

O Easypanel detectará automaticamente o **Dockerfile**. Configure:

**Build Settings:**
- ✅ **Dockerfile Path**: `./Dockerfile` (padrão)
- ✅ **Context Path**: `.` (raiz do projeto)
- ✅ **Build Args**: (deixe vazio)

**Port Configuration:**
- ✅ **Container Port**: `80`
- ✅ **Public Port**: `80` ou `443` (com SSL)

### 3️⃣ Configurar Variáveis de Ambiente

Vá em **Settings → Environment Variables** e adicione:

```bash
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-publica-aqui
VITE_WHATSAPP_NUMBER=5511986751552
```

**⚠️ Importante:**
- Cole suas credenciais **reais** do Supabase
- Obtenha em: [Supabase Dashboard](https://supabase.com/dashboard) → Project Settings → API
- O número do WhatsApp é opcional

### 4️⃣ Configurar Domínio (Opcional)

1. Vá em **Settings → Domains**
2. Adicione seu domínio customizado:
   - Exemplo: `lukayagriffe.com.br`
3. Configure os registros DNS conforme instruído
4. Ative SSL automático (Let's Encrypt)

### 5️⃣ Deploy!

1. Clique em **"Deploy"** ou **"Build & Deploy"**
2. Aguarde o build (2-5 minutos)
3. Acesse a URL fornecida pelo Easypanel
4. ✅ **Sistema funcionando!**

---

## 🔧 Configurações Detalhadas

### Configuração Completa do Serviço

**Service Name**: `lukaya-griffe`

**General:**
- **Type**: Web Service
- **Port**: 80
- **Health Check**: `/health`
- **Health Check Interval**: 30s

**Resources:**
- **CPU**: 0.5 CPU (mínimo) - 1 CPU (recomendado)
- **Memory**: 512MB (mínimo) - 1GB (recomendado)
- **Storage**: 1GB (para cache de build)

**Scaling:**
- **Min Replicas**: 1
- **Max Replicas**: 3 (para alta disponibilidade)
- **Auto-scaling**: Baseado em CPU (70%)

### Variáveis de Ambiente Completas

```bash
# Supabase (OBRIGATÓRIO)
VITE_SUPABASE_URL=https://hnkhihzeqtzqzybkjype.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# WhatsApp (OPCIONAL)
VITE_WHATSAPP_NUMBER=5511986751552

# Node Environment (OPCIONAL)
NODE_ENV=production
```

---

## 📊 Monitoramento

### Health Check

O sistema inclui um endpoint de health check:

```
GET /health
Response: 200 OK
```

Configure no Easypanel:
- **Path**: `/health`
- **Interval**: 30 segundos
- **Timeout**: 5 segundos
- **Unhealthy Threshold**: 3 tentativas

### Logs

Visualize logs em tempo real:
1. Vá em **Logs** no painel do Easypanel
2. Filtre por nível (info, warn, error)
3. Busque por palavras-chave

**Logs Importantes:**
```
✅ Variáveis de ambiente configuradas!
🔧 Configuração carregada
📡 SUPABASE_URL: https://...
📱 WHATSAPP: 5511986751552
```

### Métricas

Monitore:
- **CPU Usage**: Deve ficar < 50% em operação normal
- **Memory**: Deve ficar < 400MB
- **Response Time**: < 500ms
- **Uptime**: Objetivo 99.9%

---

## 🔄 CI/CD Automático

### Deploy Automático via Git

O Easypanel pode fazer deploy automático quando você fizer push:

1. Vá em **Settings → Git Integration**
2. Ative **"Auto Deploy"**
3. Escolha o branch: `main` ou sua branch de produção
4. Cada push irá:
   - ✅ Fazer build automático
   - ✅ Executar health check
   - ✅ Fazer rollout gradual
   - ✅ Rollback automático se falhar

### Workflow Recomendado

```bash
# 1. Desenvolver localmente
npm run dev

# 2. Testar
npm run build
npm run preview

# 3. Commitar
git add .
git commit -m "feat: nova funcionalidade"

# 4. Push (deploy automático)
git push origin main

# 5. Monitorar deploy no Easypanel
```

---

## 🐛 Troubleshooting

### Build Falha

**Problema**: "Build failed" ou "Image build error"

**Solução**:
```bash
# 1. Verificar Dockerfile
cat Dockerfile

# 2. Testar build local
docker build -t lukaya-test .

# 3. Verificar logs no Easypanel
# Vá em Logs → Build Logs
```

### Variáveis de Ambiente Não Funcionam

**Problema**: Sistema carrega valores padrão

**Solução**:
1. Verifique se as variáveis estão no formato correto: `VITE_*`
2. Reconstrua a aplicação após adicionar variáveis
3. Verifique logs: `Variáveis de ambiente configuradas!`

**Teste:**
```bash
# No browser console (F12):
console.log(window._env_)
```

### Erro 502 Bad Gateway

**Problema**: Nginx não inicia ou porta incorreta

**Solução**:
1. Verifique se a porta está configurada como **80**
2. Veja logs: `nginx: [emerg]`
3. Reconstrua a imagem

### Imagens Não Carregam

**Problema**: Imagens retornam 404

**Solução**:
1. Verifique se as imagens estão em `public/`
2. Use URLs absolutas: `/imagem.png`
3. Configure CORS se usar Supabase Storage

### Performance Lenta

**Problema**: Site demora para carregar

**Solução**:
1. Aumente recursos (CPU/Memory)
2. Ative CDN no Easypanel
3. Otimize imagens (usar WebP)
4. Ative cache no nginx (já configurado)

---

## 🔒 Segurança em Produção

### Checklist de Segurança

Antes de ir para produção:

- [ ] ✅ Variáveis de ambiente configuradas (não hardcoded)
- [ ] ✅ HTTPS/SSL ativado
- [ ] ✅ Headers de segurança configurados (nginx.conf)
- [ ] ✅ Row Level Security (RLS) ativado no Supabase
- [ ] ✅ Autenticação real implementada
- [ ] ✅ Rate limiting configurado
- [ ] ✅ Backup do banco de dados agendado
- [ ] ✅ Monitoramento configurado
- [ ] ✅ Logs sendo coletados

### Headers de Segurança

Já configurados no `nginx.conf`:
```nginx
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

### Backups

Configure backup do Supabase:
1. Supabase Dashboard → Settings → Backups
2. Ative **Daily Backups**
3. Configure retenção: 7 dias (mínimo)

---

## 📈 Otimizações

### Cache

O nginx já está configurado para:
- ✅ Cache de assets estáticos (1 ano)
- ✅ Gzip compression
- ✅ Cache de imagens

### CDN

Ative CDN no Easypanel:
1. Settings → CDN
2. Ative para assets `/assets/*`
3. Configure cache TTL: 1 ano

### Performance

Recomendações:
```bash
# 1. Minificar assets (já feito pelo Vite)
npm run build

# 2. Usar imagens otimizadas
# - WebP ao invés de PNG/JPG
# - Tamanho máximo: 200KB

# 3. Lazy loading (implementar)
# - Carregar imagens sob demanda
# - Code splitting por rota
```

---

## 🔄 Atualizações e Rollback

### Atualizar Aplicação

```bash
# 1. Fazer alterações locais
# 2. Testar
npm run dev

# 3. Commitar
git add .
git commit -m "update: descrição"

# 4. Push (deploy automático)
git push origin main

# 5. Monitorar no Easypanel
# Logs → Deployment Logs
```

### Rollback

Se algo der errado:

1. Vá em **Deployments** no Easypanel
2. Veja histórico de deploys
3. Clique em **"Rollback"** na versão anterior
4. Confirme

Ou via Git:
```bash
# Reverter último commit
git revert HEAD
git push origin main

# Voltar para commit específico
git reset --hard <commit-hash>
git push origin main --force
```

---

## 💰 Custos Estimados

### Easypanel (Self-Hosted)

Se você hospeda o Easypanel:
- **Servidor VPS**: $5-20/mês (DigitalOcean, Linode, Hetzner)
- **Lukaya Griffe**: $0 (roda no mesmo servidor)

### Easypanel Cloud

Se usar cloud do Easypanel:
- **Starter**: $10/mês (512MB RAM, 0.5 CPU)
- **Pro**: $20/mês (1GB RAM, 1 CPU) - **Recomendado**
- **Business**: $50/mês (2GB RAM, 2 CPU)

### Supabase

- **Free**: $0/mês (500MB database, 1GB file storage)
- **Pro**: $25/mês (8GB database, 100GB storage) - **Recomendado para produção**

### Total Estimado

**Desenvolvimento/Teste**: $0-10/mês
**Produção**: $30-45/mês (Easypanel Pro + Supabase Pro)

---

## 🎯 Checklist Final

Antes de considerar o deploy completo:

### Configuração
- [ ] Dockerfile criado e testado
- [ ] Variáveis de ambiente configuradas
- [ ] Domínio apontado (se aplicável)
- [ ] SSL/HTTPS ativado

### Funcionalidade
- [ ] Catálogo carrega corretamente
- [ ] Admin funciona
- [ ] Filtros funcionam
- [ ] Carrinho persiste
- [ ] WhatsApp abre corretamente
- [ ] Imagens carregam

### Performance
- [ ] Site carrega < 3 segundos
- [ ] Imagens otimizadas
- [ ] Cache configurado
- [ ] Gzip ativado

### Segurança
- [ ] HTTPS ativado
- [ ] Headers de segurança configurados
- [ ] RLS ativado no Supabase
- [ ] Credenciais seguras (não hardcoded)

### Monitoramento
- [ ] Health check configurado
- [ ] Logs funcionando
- [ ] Alertas configurados (opcional)
- [ ] Backup agendado

---

## 📞 Suporte

### Recursos

- 📖 [Documentação Easypanel](https://easypanel.io/docs)
- 💬 [Discord Easypanel](https://discord.gg/easypanel)
- 🐛 [Issues GitHub](https://github.com/Diguinsilva/Codigin/issues)

### Ajuda Adicional

- **Email**: contato@lukayagriffe.com.br
- **WhatsApp**: (11) 98675-1552

---

## ✅ Comandos Úteis

### Docker Local (Teste)

```bash
# Build da imagem
docker build -t lukaya-griffe .

# Rodar localmente
docker run -p 8080:80 \
  -e VITE_SUPABASE_URL=https://... \
  -e VITE_SUPABASE_ANON_KEY=... \
  -e VITE_WHATSAPP_NUMBER=5511986751552 \
  lukaya-griffe

# Acessar
open http://localhost:8080

# Ver logs
docker logs -f <container-id>

# Parar
docker stop <container-id>
```

### Easypanel CLI

```bash
# Instalar CLI
npm install -g easypanel

# Login
easypanel login

# Deploy
easypanel deploy

# Logs
easypanel logs lukaya-griffe

# Status
easypanel status
```

---

**🎉 Pronto! Seu sistema Lukaya Griffe está no ar!**

Acesse seu domínio e comece a vender! 🛍️

---

**Última atualização**: Novembro 2024
**Versão**: 1.0.0
