# =====================================================================
# Dockerfile — Gravity Car System Web (React + Vite → Nginx)
# Compila o frontend e serve com Nginx de alta performance
# =====================================================================

# Estágio 1: Build do React com Vite
FROM node:20-alpine AS build
WORKDIR /app

# Instala dependências (cache de layers)
COPY package*.json ./
RUN npm ci --silent

# Copia o código e compila para produção
COPY . .
RUN npm run build

# Estágio 2: Serve com Nginx
FROM nginx:alpine AS final

# Copia os arquivos compilados do React
COPY --from=build /app/dist /usr/share/nginx/html

# Copia a configuração do Nginx (SPA routing + proxy da API)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
