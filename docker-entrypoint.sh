#!/bin/sh

# Script para substituir variáveis de ambiente em runtime
# Isso permite que o Easypanel injete as env vars sem rebuild

set -e

# Diretório onde os arquivos estão
ROOT_DIR=/usr/share/nginx/html

# Encontrar todos os arquivos JS no build
echo "🔧 Injetando variáveis de ambiente..."

# Criar arquivo de configuração JavaScript com as variáveis
cat > ${ROOT_DIR}/env-config.js <<EOF
window._env_ = {
  VITE_SUPABASE_URL: "${VITE_SUPABASE_URL}",
  VITE_SUPABASE_ANON_KEY: "${VITE_SUPABASE_ANON_KEY}",
  VITE_WHATSAPP_NUMBER: "${VITE_WHATSAPP_NUMBER:-5511986751552}"
};
EOF

echo "✅ Variáveis de ambiente configuradas!"
echo "📡 SUPABASE_URL: ${VITE_SUPABASE_URL}"
echo "📱 WHATSAPP: ${VITE_WHATSAPP_NUMBER:-5511986751552}"

# Executar o comando original (nginx)
exec "$@"
