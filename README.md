# FILM!

## Установка

### PostgreSQL

Установите PostgreSQL скачав дистрибутив с официального сайта или используйте Docker.

Заполните необходимые параметры БД и пользователя в файле `docker-compose.yml` и запустите контейнер.

```
docker-compose up -d
```

Восстановите тестовые данные из дампов, выполнив команды из корня проекта:

```
docker exec -i postgres_container psql -U postgres -d films < backend/test/prac.init.sql
docker exec -i postgres_container psql -U postgres -d films < backend/test/prac.films.sql
docker exec -i postgres_container psql -U postgres -d films < backend/test/prac.shedules.sql
```

### Бэкенд

Перейдите в папку с исходным кодом бэкенда:

`cd backend`

Установите зависимости:

`npm i`

Создайте `.env` файл из примера `.env.example`, в нём укажите:

* `DATABASE_DRIVER` - тип драйвера СУБД - в нашем случае это `postgres`
* `DATABASE_URL` - адрес СУБД PostgreSQL, например `postgres://127.0.0.1:5432/films`
* `DATABASE_USERNAME` - имя пользователя БД
* `DATABASE_PASSWORD` - пароль пользователя БД

PostgreSQL должна быть установлена и запущена.

Запустите бэкенд:

`npm run start:debug`

Для проверки отправьте тестовый запрос с помощью Postman или `curl`.

### Фронтенд

Перейдите в папку с исходным кодом фронтенда:

`cd frontend`

Установите зависимости:

`npm i`

Создайте `.env` файл из примера `.env.example` и укажите адрес локального бэкенда:

```
VITE_API_URL=http://localhost:3000/api/afisha
VITE_CDN_URL=http://localhost:3000/content/afisha
```

Запустите фронтенд в режиме разработки:

`npm run dev`

Приложение откроется по адресу `http://localhost:5173`.
