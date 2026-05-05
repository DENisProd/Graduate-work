# Smart Home System - Frontend

Фронтенд приложение для системы умного дома с поддержкой смены тем и языков.

## Технологический стек

- **Next.js 16** - React фреймворк с App Router
- **TypeScript** - статическая типизация
- **Zustand** - управление состоянием
- **shadcn/ui** - UI компоненты
- **Tailwind CSS v4** - стилизация
- **Framer Motion** - анимации

## Структура проекта

```
src/
├── app/                    # Next.js App Router
│   ├── globals.css         # Глобальные стили
│   ├── layout.tsx          # Корневой layout
│   └── page.tsx            # Главная страница
├── components/             # React компоненты
│   ├── ui/                 # UI компоненты (ThemeSwitcher, LanguageSwitcher)
│   ├── layout/             # Компоненты макета (Header, Footer)
│   ├── features/           # Функциональные компоненты
│   └── shared/             # Переиспользуемые компоненты
├── store/                  # Zustand store
│   ├── theme-store.ts      # Состояние темы
│   └── language-store.ts   # Состояние языка
├── locales/                # Файлы переводов
│   ├── en/common.json      # Английские переводы
│   └── ru/common.json      # Русские переводы
├── types/                  # TypeScript типы
│   ├── theme.ts            # Типы для темы
│   └── language.ts         # Типы для языка
├── lib/                    # Утилиты
│   ├── i18n.ts             # Функции перевода
│   └── utils.ts            # Вспомогательные функции
├── hooks/                  # React хуки
│   ├── use-theme.ts        # Хук для работы с темой
│   └── use-language.ts     # Хук для работы с языком
├── config/                 # Конфигурация
│   ├── theme.config.ts     # Настройки темы
│   └── i18n.config.ts      # Настройки локализации
└── styles/                 # Дополнительные стили
    └── themes/             # CSS переменные для тем
```

## Установка и запуск

```bash
# Установка зависимостей
pnpm install

# Запуск в режиме разработки
pnpm dev

# Сборка проекта
pnpm build

# Запуск production сервера
pnpm start
```

## Функционал

### Система смены тем

- Три режима: светлая, тёмная, системная
- Автоматическое определение системной темы
- Сохранение выбора в localStorage
- Плавные переходы между темами

**Использование:**
```tsx
import { useTheme } from '@/hooks';

function MyComponent() {
  const { theme, setTheme, toggleTheme, isDark } = useTheme();
  
  return (
    <button onClick={toggleTheme}>
      {isDark ? 'Switch to Light' : 'Switch to Dark'}
    </button>
  );
}
```

### Система локализации

- Поддержка английского и русского языков
- Автоматическое определение языка браузера
- Сохранение выбора в localStorage и cookies
- Типизированные переводы

**Использование:**
```tsx
import { useTranslation } from '@/hooks';

function MyComponent() {
  const { t, locale, setLocale } = useTranslation();
  
  return (
    <div>
      <h1>{t('common.welcome')}</h1>
      <button onClick={() => setLocale('ru')}>Русский</button>
    </div>
  );
}
```

### Zustand Store

**Theme Store:**
```tsx
import { useThemeStore } from '@/store';

// Состояние
interface ThemeStore {
  theme: 'light' | 'dark' | 'system';
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}
```

**Language Store:**
```tsx
import { useLanguageStore } from '@/store';

// Состояние
interface LanguageStore {
  locale: 'en' | 'ru';
  setLocale: (locale: Locale) => void;
}
```

## Компоненты

### UI Компоненты

- `ThemeSwitcher` - выпадающее меню выбора темы
- `ThemeToggle` - простой переключатель светлая/тёмная
- `LanguageSwitcher` - компактный переключатель языка
- `LanguageSelect` - полноразмерный выбор языка

### Layout Компоненты

- `Header` - шапка с навигацией и переключателями
- `Footer` - подвал сайта

## Конфигурация

### Path Aliases (tsconfig.json)

```json
{
  "paths": {
    "@/*": ["./src/*"],
    "@/components/*": ["./src/components/*"],
    "@/store/*": ["./src/store/*"],
    "@/hooks/*": ["./src/hooks/*"],
    "@/lib/*": ["./src/lib/*"],
    "@/types/*": ["./src/types/*"],
    "@/config/*": ["./src/config/*"],
    "@/locales/*": ["./src/locales/*"]
  }
}
```

## Добавление новых переводов

1. Добавьте ключи в `src/locales/en/common.json`
2. Добавьте переводы в `src/locales/ru/common.json`
3. Используйте через хук: `t('namespace.key')`

## Добавление новой темы

1. Создайте файл в `src/styles/themes/`
2. Определите CSS переменные
3. Импортируйте в `src/styles/themes/index.css`

## Лицензия

MIT
