# Этап 1: Сборка фронтенда
FROM node:20 AS builder

WORKDIR /app

# Копируем package.json и package-lock.json
COPY package.json package-lock.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем исходный код
COPY . .

# Собираем проект
RUN npm run build

# Проверяем, что сборка прошла успешно
RUN if [ ! -d "dist" ]; then echo "Build failed: dist directory not found"; exit 1; fi


# Этап 2: Сервер (nginx)
FROM nginx:alpine

# Копируем собранный фронтенд из предыдущего этапа
COPY --from=builder /app/dist /usr/share/nginx/html

# Открываем порт 80
EXPOSE 80

# Запускаем nginx
CMD ["nginx", "-g", "daemon off;"]
