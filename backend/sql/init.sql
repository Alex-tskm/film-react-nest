-- Включение расширения uuid-ossp, если оно ещё не установлено
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Создание пользователя только если его нет
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'prac') THEN
        CREATE USER prac WITH PASSWORD 'prac';
    END IF;
END
$$;

-- Создание базы данных только если её нет
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'prac') THEN
        CREATE DATABASE prac OWNER prac;
    END IF;
END
$$;

-- Переключение на базу данных prac (выполняется автоматически при подключении через docker-entrypoint-initdb.d)
\c prac

-- Предоставление прав пользователю prac на базу данных
GRANT ALL PRIVILEGES ON DATABASE prac TO prac;

-- Установка владельца схемы public
ALTER SCHEMA public OWNER TO prac;

-- Удаление существующих таблиц, если они есть (чтобы избежать конфликтов при повторном запуске)
DROP TABLE IF EXISTS public.schedules CASCADE;
DROP TABLE IF EXISTS public.films CASCADE;

-- Создание таблицы фильмов с UUID
CREATE TABLE public.films (
    id          uuid default uuid_generate_v4() not null
        constraint "PK_697487ada088902377482c970d1"
            primary key,
    rating      double precision              not null,
    director    varchar	 	              not null,
    tags        text                          not null,
    image       varchar		              not null,
    cover       varchar	                      not null,
    title       varchar	                      not null,
    about       varchar                       not null,
    description varchar                       not null
);

-- Установка владельца таблицы films
ALTER TABLE public.films OWNER TO prac;

-- Создание таблицы расписания с UUID и связью с фильмами
CREATE TABLE public.schedules (
    id       uuid default uuid_generate_v4() not null
        constraint "PK_7e33fc2ea755a5765e3564e66dd"
            primary key,
    daytime  varchar                      not null,
    hall     integer                      not null,
    rows     integer                      not null,
    seats    integer                      not null,
    price    double precision             not null,
    taken    text                         not null,
    "filmId" uuid                         not null
        constraint "FK_1c2f5e637713a429f4854024a76"
            references public.films(id)
            on delete cascade
);

-- Установка владельца таблицы schedules
ALTER TABLE public.schedules OWNER TO prac;

-- Создание индексов для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_schedules_filmid ON public.schedules("filmId");
CREATE INDEX IF NOT EXISTS idx_films_title ON public.films(title);

-- Предоставление всех прав пользователю prac на таблицы
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO prac;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO prac;

-- Установка прав по умолчанию для будущих таблиц
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON TABLES TO prac;

-- Создание роли postgres
CREATE ROLE postgres WITH LOGIN PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE prac TO postgres;
GRANT ALL ON SCHEMA public TO postgres;
