# local-backend

Локальный backend сервиса `Домовой`. Это HTTP/WebSocket-сервер на Rust, который работает на объекте, хранит локальные данные в `SQLite`, принимает телеметрию через `MQTT`, исполняет сценарии автоматизации и синхронизируется с облачным контуром при наличии связи.

Сервис запускает бинарник `local-server` и входит в состав локального сегмента системы `Smart Home / Домовой`.

## Оглавление

- [Назначение](#назначение)
- [Состав сервиса](#состав-сервиса)
- [Возможности](#возможности)
- [Требования](#требования)
- [Конфигурация](#конфигурация)
- [Локальный запуск](#локальный-запуск)
- [Запуск в Docker](#запуск-в-docker)
- [Тестирование](#тестирование)
- [Полезные маршруты](#полезные-маршруты)

## Назначение

`local-backend` предназначен для выполнения локальной серверной логики на объекте:

- управление локальным API для веб-интерфейса
- учёт устройств и физических устройств
- хранение локальных состояний в `SQLite`
- обработка `Zigbee`-телеметрии через `MQTT`
- интеграция с `Modbus`
- выполнение сценариев автоматизации
- локальная проверка прав доступа
- фоновая синхронизация с облачными сервисами

## Состав сервиса

Проект организован как Rust workspace из пяти crate:

- `src/core` - доменные сущности и ошибки
- `src/application` - бизнес-логика, сценарии, доступ, синхронизация
- `src/infrastructure` - `SQLite`, `MQTT`, HTTP-клиенты облака, интеграции
- `src/interfaces` - REST API и WebSocket / Socket.IO-интеграция
- `src/gateway` - точка входа, конфигурация и сборка приложения

Основной бинарник:

```text
src/gateway/src/main.rs
```

## Возможности

Сервис поднимает:

- REST API под префиксом `/api/v1`
- Swagger UI на `/docs`
- realtime-канал для обновления состояний устройств
- движок сценариев
- фоновые задачи синхронизации:
  - outbox push
  - delta pull
  - sync сценариев
  - sync физических устройств
  - sync виджетных панелей

Основные группы API:

- `system`
- `devices`
- `device_categories`
- `physical_devices`
- `zigbee`
- `scenarios`
- `scenario_executions`
- `access`
- `widget_dashboards`
- `modbus`

## Требования

Для локального запуска нужны:

- `Rust` toolchain
- `cargo`
- `SQLite`
- доступ к MQTT-брокеру, если нужен обмен с Zigbee/Modbus в реальном времени

Для контейнерного запуска нужны:

- `Docker`
- `Docker Compose` или обычный `docker build` / `docker run`

## Конфигурация

Сервис читает конфигурацию в таком порядке:

1. `config/default.toml`
2. `config/local.toml`
3. переменные окружения
4. `.env` в корне сервиса для локальной разработки

### Базовые параметры

Файл [default.toml](file:///c:/Users/User/Documents/projects/Graduate-work/local-server/local-backend/config/default.toml) задаёт значения по умолчанию:

- `port = 8080`
- `database_url = "sqlite:./data/local.db"`
- `max_db_connections = 5`
- `busy_timeout_ms = 5000`
- `graceful_shutdown_secs = 10`
- `mqtt_topic_prefix = "zigbee2mqtt"`
- `access_service_url = "http://localhost:8085"`

### Поддерживаемые переменные окружения

Актуальные переменные, которые переопределяют конфигурацию:

- `LOCAL_SERVER_PORT`
- `DATABASE_URL`
- `ZIGBEE_MQTT_URL`
- `MQTT_TOPIC_PREFIX`
- `ACCESS_SERVICE_URL`
- `LOCAL_SERVER_PUBLIC_URL`
- `CLOUD_SYNC_API_URL`
- `CLOUD_SYNC_API_KEY`
- `SYNC_INTERVAL_SECS`
- `SCENARIO_SERVICE_URL`
- `LOCAL_SERVER_SERIAL`

### Быстрый старт с `.env`

В сервисе есть пример:

```bash
cp .env.example .env
```

Текущий шаблон содержит минимальный набор:

```env
LOCAL_SERVER_PORT=4100
DATABASE_URL=sqlite:./data/local.db
SYNC_INTERVAL_SECS=300
ZIGBEE_MQTT_URL="mqtt://192.168.0.217:1883"
```

Если нужен отдельный локальный файл конфигурации, используйте:

```bash
cp config/local.toml.example config/local.toml
```

## Локальный запуск

### 1. Перейти в директорию сервиса

```bash
cd local-server/local-backend
```

### 2. Подготовить конфигурацию

Минимальный вариант:

```bash
cp .env.example .env
mkdir -p data
```

На Windows каталог можно создать так:

```powershell
New-Item -ItemType Directory -Force data
```

### 3. Запустить сервис

```bash
cargo run -p local-server
```

После старта сервис:

- инициализирует `SQLite`
- загружает сценарии
- пытается подключиться к `MQTT`
- поднимает HTTP-сервер
- запускает фоновые задачи синхронизации

Если `MQTT` недоступен, backend не падает, а продолжает работу в деградированном режиме.

### Production-сборка

```bash
cargo build --release -p local-server
```

Запуск release-бинарника:

```bash
./target/release/local-server
```

На Windows:

```powershell
.\target\release\local-server.exe
```

## Запуск в Docker

Сервис можно собрать отдельно:

```bash
docker build -t local-server-backend .
```

Запуск контейнера:

```bash
docker run --rm -p 8080:8080 \
  -e LOCAL_SERVER_PORT=8080 \
  -e DATABASE_URL=sqlite:/app/data/local.db \
  -v ${PWD}/data:/app/data \
  local-server-backend
```

Примечания:

- `Dockerfile` собирает бинарник `local-server` в multi-stage режиме
- каталог `migrations` вшивается на этапе сборки
- runtime-образ основан на `debian:bookworm-slim`
- по умолчанию профиль **`release-device`** (быстрая сборка на Orange Pi / ARM SBC)

### Сборка на Orange Pi и других одноплатниках

Сборка Rust на слабом ARM может занимать 20–40 минут. Основные ускорения уже включены в `Dockerfile`:

| Что | Эффект |
|-----|--------|
| профиль `release-device` (`lto=false`, `codegen-units=16`) | в 2–4 раза быстрее, чем `release` с полным LTO |
| linker **mold** | быстрее этап линковки |
| BuildKit cache (`registry` + `git` + `target`) | повторные сборки только перекомпилируют изменённый код |

Включите BuildKit и соберите из корня `local-server`:

```bash
DOCKER_BUILDKIT=1 docker compose build local-backend
```

На платах с 1–2 GB RAM ограничьте параллелизм:

```bash
docker compose build local-backend --build-arg BUILD_JOBS=2
```

Максимальная оптимизация бинарника (медленная сборка):

```bash
docker compose build local-backend --build-arg CARGO_PROFILE=release
```

**Лучший вариант для Orange Pi — не собирать на плате**, а собрать образ на ПК и загрузить на плату:

```bash
# на ПК (Linux/macOS с Docker Buildx)
docker buildx build --platform linux/arm64 \
  -t local-backend:arm64 \
  --load ./local-backend

docker save local-backend:arm64 | ssh orangepi docker load
```

Или пушить готовый образ в registry и на плате делать только `docker compose pull`.

На практике этот сервис обычно поднимается не отдельно, а через корневой `docker-compose.yml` в `local-server`.

## Тестирование

### Все тесты

```bash
cargo test
```

### Только unit-тесты логики условий сценариев

```bash
cargo test conditions::tests -- --nocapture
```

### Только smoke-тест health endpoint

```bash
cargo test --test health_test health_endpoint_reports_db_ok -- --nocapture
```

### Что уже покрыто тестами

На текущий момент в сервисе есть тесты для:

- `GET /api/v1/system/health`
- условий сценариев:
  - проверка состояния устройства
  - отсутствие требуемого атрибута
  - составные условия `AND` и `NOT`
- логики `RBAC/ABAC`:
  - приоритет `DENY`
  - стратегия `ALLOW_OVERRIDES`

Если нужно запустить конкретный crate workspace:

```bash
cargo test -p local-server-application
cargo test -p local-server
```

## Полезные маршруты

После запуска сервиса доступны:

- `GET /api/v1/system/health` - проверка состояния backend и БД
- `GET /docs` - Swagger UI
- `GET /api/v1/zigbee/devices` - список Zigbee-устройств
- `GET /api/v1/scenarios` - список сценариев
- `GET /api/v1/modbus/devices` - список Modbus-устройств

## Пример типового сценария запуска

```bash
cd local-server/local-backend
cp .env.example .env
cargo test --test health_test health_endpoint_reports_db_ok -- --nocapture
cargo run -p local-server
```

## Связанные части проекта

- корневой локальный контур: [local-server/README.md](file:///c:/Users/User/Documents/projects/Graduate-work/local-server/README.md)
- бинарник запуска: [main.rs](file:///c:/Users/User/Documents/projects/Graduate-work/local-server/local-backend/src/gateway/src/main.rs)
- конфигурация: [config.rs](file:///c:/Users/User/Documents/projects/Graduate-work/local-server/local-backend/src/gateway/src/config.rs)
- маршруты API: [mod.rs](file:///c:/Users/User/Documents/projects/Graduate-work/local-server/local-backend/src/interfaces/src/http/mod.rs)
