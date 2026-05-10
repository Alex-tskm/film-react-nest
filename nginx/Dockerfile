FROM nginx:alpine

# Удаляем дефолтную конфигурацию
RUN rm -f /etc/nginx/conf.d/default.conf

# Копируем нашу конфигурацию
COPY default.conf /etc/nginx/conf.d/default.conf

# Проверяем, что конфигурация скопировалась
RUN if [ ! -f "/etc/nginx/conf.d/default.conf" ]; then \
    echo "Error: default.conf not found in build context"; \
    exit 1; \
fi

# Метки образа
LABEL maintainer="your-email@example.com"
LABEL description="Nginx server for frontend and API proxy"
LABEL version="1.0.0"

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
