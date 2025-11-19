# ⚡ Deploy Rápido no Easypanel - 5 Minutos

## 🚀 Passo a Passo

### 1. Criar Serviço no Easypanel
```
1. Login no Easypanel
2. New Project → Deploy from GitHub
3. Escolher repositório: Codigin
4. Branch: claude/atrio-2025-01HWL3BMw9ffxddmrL5X5qwC
```

### 2. Configurar Variáveis de Ambiente
```bash
# Vá em Settings → Environment Variables
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-aqui
VITE_WHATSAPP_NUMBER=5577999838660
```

### 3. Deploy
```
1. Clique em "Deploy"
2. Aguarde 2-5 minutos
3. Acesse a URL fornecida
4. ✅ Pronto!
```

## 📋 Configurações Recomendadas

**Port**: 80
**Health Check**: `/health`
**CPU**: 0.5-1 CPU
**Memory**: 512MB-1GB

## 🔗 Links Úteis

- 📖 [Guia Completo](EASYPANEL.md)
- 🐳 [Dockerfile](Dockerfile)
- ⚙️ [Variáveis de Ambiente](.env.example)

## 🆘 Problemas?

Veja [EASYPANEL.md](EASYPANEL.md) seção Troubleshooting

---

**Total**: ~5 minutos do zero ao ar! 🎉
