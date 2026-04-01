# Access Control Service (NestJS + Prisma)

Сервис управления доступом — реплика Java access-control-service на NestJS, TypeScript и Prisma.

## Функционал

- **Дома** — CRUD, список по владельцу, список всех (админ)
- **Участники домов** — добавить/удалить, список по дому, дома пользователя
- **Комнаты** — CRUD, список по дому
- **Приглашения** — создать, принять/отклонить/отозвать, по токену и по дому
- **Права доступа** — создать/обновить/удалить права, проверка доступа (check), очистка истекших

API совместим с исходным сервисом: те же пути под префиксом `/api/v1`, те же DTO и коды ответов.

## Требования

- Node.js 18+
- PostgreSQL (та же БД, что и у Java-сервиса, или новая)

## Установка

```bash
cd backend/services/access-control-service-nest
npm install
cp .env.example .env
# Отредактировать .env (DATABASE_URL, PORT)
```

## База данных

Используются те же таблицы, что и в Java-сервисе (`access_*`). Можно:

1. Подключиться к существующей БД Java-сервиса (тогда миграции не запускать, только `prisma generate`).
2. Создать новую БД и применить миграции:

```bash
npx prisma migrate dev --name init
# или только push схемы без миграций:
npx prisma db push
```

Генерация клиента Prisma (обязательно после клона/изменения схемы):

```bash
npm run prisma:generate
```

## Запуск

```bash
# development
npm run start:dev

# production
npm run build
npm run start:prod
```

Порт по умолчанию: **8085** (или `PORT` / `ACCESS_CONTROL_SERVICE_PORT` из `.env`).

- API: `http://localhost:8085/api/v1`
- Swagger: `http://localhost:8085/swagger` (если приложение запущено с включённым Swagger)

## Заголовок X-User-Id

Для операций, требующих текущего пользователя, передаётся заголовок **X-User-Id** (UUID):

- создание/обновление/удаление прав доступа;
- создание приглашения;
- принятие и отзыв приглашения.

## Конфигурация

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `DATABASE_URL` | URL PostgreSQL | — |
| `PORT` / `ACCESS_CONTROL_SERVICE_PORT` | Порт HTTP | 8085 |
