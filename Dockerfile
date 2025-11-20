# Multi-stage build para otimizar tamanho da imagem

# Stage 1: Build da aplicação
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar TODAS as dependências (incluindo devDependencies para o build)
RUN npm ci && npm cache clean --force

# Copiar código fonte
COPY . .

# Build da aplicação (as variáveis de ambiente serão injetadas em runtime)
RUN npm run build

# Stage 2: Servir com nginx
FROM nginx:alpine

# Copiar build da aplicação
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuração customizada do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expor porta 80
EXPOSE 80

# Script para injetar variáveis de ambiente em runtime
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Usar script de entrada
ENTRYPOINT ["/docker-entrypoint.sh"]

# Comando padrão
CMD ["nginx", "-g", "daemon off;"]
