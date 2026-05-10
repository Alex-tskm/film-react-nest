# Этап 1: Сборка бэкенда
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем package.json, package-lock.json и tsconfig
COPY package*.json ./
COPY tsconfig*.json ./

# Устанавливаем все зависимости
RUN npm ci

# Копируем исходный код
COPY . .

# Собираем проект
RUN npm run build

# Проверяем, что сборка прошла успешно
RUN if [ ! -d "dist" ]; then echo "Build failed: dist directory not found"; exit 1; fi

# Продакшен этап
FROM node:20-alpine

WORKDIR /app

# Добавляем пользователя для безопасности
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Копируем production-зависимости
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Копируем собранный код
COPY --from=builder /app/dist ./dist

# Копируем статику
COPY public ./public

# Меняем владельца файлов
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3000

# Метки
LABEL maintainer="your-email@example.com"
LABEL version="1.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "dist/main.js"]
