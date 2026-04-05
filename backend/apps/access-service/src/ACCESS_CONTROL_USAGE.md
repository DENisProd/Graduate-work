# Система контроля прав: как работает и как использовать

Этот документ описывает текущую реализацию сервиса контроля доступа в проекте `access-control-service-nest`: модель данных, логику принятия решения и практические сценарии работы с API.

## 1) Что делает система

Сервис управляет доступом к ресурсам дома:

- дом (`HOUSE`);
- комната (`ROOM`);
- устройство (`DEVICE`);
- функция устройства (`DEVICE_FUNCTION`);
- и другие типы ресурсов (`SCENE`, `GROUP`, `AUTOMATION`).

В системе сочетаются:

- `RBAC` через `AccessRight` (права на участника или роль);
- `ABAC` через `AccessPolicy` (политики с `subjectType`, `subjectId`, `priority`, `condition`);
- кэш эффективных прав `EffectivePermission` для ускорения проверок.

## 2) Базовые сущности

- `User` - внутренний пользователь сервиса, привязанный к `externalUserId`.
- `House` - дом с владельцем, участниками и стратегией разрешения конфликтов.
- `HouseMember` - участие пользователя в доме.
- `HouseRole` + `HouseMemberRole` - роли дома и назначения ролей участникам.
- `Resource` - иерархия ресурсов дома (с `parentId`, `path`, `depth`).
- `AccessRight` - конкретное право (`ALLOW`, `DENY`, `READ`, `WRITE`) на ресурс:
  - либо для `houseMemberId` (прямое право),
  - либо для `roleId` (через роль).
- `AccessPolicy` - ABAC-политика с приоритетом (меньше число = выше приоритет).
- `EffectivePermission` - кэш вычисленных/прямых прав.
- `AccessAuditLog` - аудит изменений.

## 3) Как принимается решение о доступе

### Контур `Access Evaluator` (`POST /api/v1/access/check`)

Проверка идет в таком порядке:

1. Находит ресурс и участника дома по `userId`.
2. Строит цепочку ресурсов от целевого к родителям (учет иерархии).
3. Проверяет `EffectivePermission` по цепочке.
4. Если решения нет - проверяет `AccessRight` (прямые + через роли).
5. Если решения нет - проверяет `AccessPolicy`.
6. Если ничего не сработало - доступ запрещен.

Дополнительно:

- более глубокий ресурс (больший `depth`) считается более специфичным;
- `DENY` имеет приоритет над разрешениями;
- `ALLOW`, `READ`, `WRITE` интерпретируются относительно действия (`READ`/`WRITE`).

Есть удобный endpoint для функции устройства:

- `POST /api/v1/access-check` (по `deviceFunctionId`, ответ `{ allow, deny }`).

### Контур `Access Control` (`POST /api/v1/access-control/check`)

Отдельный endpoint проверки в модуле `access-control`:

- смотрит права только на конкретный `resourceId`;
- возвращает расширенный список применимых прав и причину (`reason`);
- учитывает `DENY` в приоритете;
- может дополнительно сравнить `operationType` (`read`/`write`) с типом права.

## 4) Важные API-группы для работы

> Все URL ниже с глобальным префиксом: `/api/v1`.
> Для операций "от имени пользователя" передавайте заголовок `X-User-Id`.

### Ресурсы

- `POST /resources` - создать ресурс.
- `GET /resources/:id` - получить ресурс.
- `GET /houses/:houseId/resources/tree` - дерево ресурсов дома.

### Права (RBAC)

Два набора endpoint-ов:

- `access-control` (CRUD + check + pagination):
  - `POST /access-control/rights`
  - `PUT /access-control/rights/:id`
  - `DELETE /access-control/rights/:id`
  - `GET /access-control/rights/member/:memberId`
  - `GET /access-control/rights/house/:houseId`
  - `POST /access-control/check`
- `permissions` (resource-centric):
  - `POST /access-rights`
  - `GET /resources/:id/permissions`
  - `GET /access-rights/user/:id`
  - `DELETE /access-rights/:id`
  - `POST /permissions/rebuild`
  - `GET /access-structure?userId=...`

### Политики (ABAC)

- `POST /policies` - создать политику.
- `GET /houses/:houseId/policies` - получить политики дома.
- `DELETE /policies/:id` - удалить политику.

### Роли и участники

- `GET /house-roles/house/:houseId`
- `POST /house-roles/house/:houseId`
- `POST /house-roles/members/:memberId/roles/:roleId`
- `DELETE /house-roles/members/:memberId/roles/:roleId`

- `GET /house-members/house/:houseId`
- `POST /house-members?houseId=...&userId=...`
- `DELETE /house-members?houseId=...&userId=...`

## 5) Пошагово: как пользоваться системой

### Шаг 1. Создать дом и ресурсы

1. Создайте дом (`POST /houses`).
2. Создайте комнаты/устройства/функции как ресурсы (`POST /resources`) с корректными `houseId` и `parentId`.
3. Проверьте дерево (`GET /houses/:houseId/resources/tree`).

### Шаг 2. Добавить пользователей в дом

1. Добавьте участника в дом (`POST /house-members?...`).
2. При необходимости создайте роль (`POST /house-roles/house/:houseId`).
3. Назначьте роль участнику (`POST /house-roles/members/:memberId/roles/:roleId`).

### Шаг 3. Назначить права доступа (RBAC)

Создайте права на конкретный ресурс:

- либо на участника (`houseMemberId`),
- либо на роль (`houseRoleId`/`roleId` в зависимости от endpoint-а),
- одновременно оба поля указывать нельзя.

Рекомендуется задавать `expiresAt` для временных доступов.

### Шаг 4. Добавить политики (ABAC), если нужно

Если нужны более гибкие правила:

- создайте `AccessPolicy` с `subjectType` (`USER`, `ROLE`, `MEMBER`, `ANYONE`);
- задайте `priority` (меньше = выше приоритет);
- при необходимости заполните `condition` (JSON).

### Шаг 5. Проверять доступ

Используйте:

- `POST /access/check` - основной evaluator по иерархии;
- `POST /access-check` - проверка по `deviceFunctionId`;
- `POST /access-control/check` - расширенная диагностическая проверка с `applicableRights`.

### Шаг 6. Обслуживание

- периодически удаляйте истекшие права:
  - `POST /access-control/cleanup/expired`;
- при необходимости пересобирайте кэш:
  - `POST /permissions/rebuild`.

## 6) Сценарии использования

### Сценарий A: "Гостю разрешено только читать датчик"

1. Добавить гостя в `HouseMember`.
2. Создать право `READ` на ресурс функции устройства (например температура).
3. Проверка:
   - `READ` -> `allowed=true`;
   - `WRITE` -> `allowed=false`.

### Сценарий B: "Роль Семья управляет освещением"

1. Создать роль "family".
2. Назначить роль нескольким участникам.
3. Выдать право `WRITE` роли на нужные ресурсы света.
4. Все участники с этой ролью получают доступ через роль.

### Сценарий C: "Временный доступ курьеру до 18:00"

1. Создать прямое право `ALLOW` или `WRITE` участнику.
2. Указать `expiresAt`.
3. После истечения:
   - право не учитывается при проверке;
   - можно удалить автоматически через cleanup.

### Сценарий D: "Явно запретить опасную операцию"

1. Для ресурса добавить `DENY` (участнику или роли).
2. Даже при наличии других разрешающих прав `DENY` заблокирует доступ.
3. Проверка вернет отказ с причиной на основе deny-правила.

### Сценарий E: "Показать UI только по доступным зонам"

1. Вызвать `GET /access-structure?userId=<externalUserId>`.
2. Получить структуру `дом -> комнаты -> устройства -> функции`, отфильтрованную по доступу пользователя.
3. Использовать результат для построения меню/экрана в клиенте.

## 7) Практические рекомендации

- Используйте `access/check` как основной источник решения доступа в runtime.
- Держите `DENY` только там, где нужен явный запрет, чтобы избежать сложной отладки.
- Для массовых прав на группу пользователей предпочитайте права через роли.
- Для исключений и временных кейсов используйте прямые права на участника.
- Логируйте административные изменения (аудит уже встроен в сервис).

## 8) Где смотреть API

- Swagger: `/api/docs`
- Базовый API префикс: `/api/v1`

