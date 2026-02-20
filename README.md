# Редактор графу маршрутів зерносховища

Веб-додаток для візуального редагування технологічного графу маршрутів (механізми → з'єднання) із збереженням у PostgreSQL.

## Стек

| Шар | Технологія |
|-----|-----------|
| Frontend | React 18 + TypeScript + React Flow (`@xyflow/react`) + Zustand |
| Backend | Python 3.11 + FastAPI + asyncpg |
| База | PostgreSQL 16 |

## Швидкий старт

### 1. База даних

```bash
# Створити БД
createdb -U postgres graph_db

# Ініціалізувати схему та типи пристроїв
psql -U postgres -d graph_db -f backend/init.sql
```

### 2. Бекенд

```bash
cd backend

# Скопіювати змінні середовища
cp .env.example .env
# Відредагувати .env якщо потрібно (DATABASE_URL)

# Встановити залежності
pip install -r requirements.txt

# Запустити
uvicorn main:app --reload --port 8000
```

API буде доступне на [http://localhost:8000](http://localhost:8000).
Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)

### 3. Фронтенд

```bash
cd frontend
npm install
npm run dev
```

Відкрити [http://localhost:5173](http://localhost:5173)

## Використання

1. Натисніть **"Завантажити з БД"** — підтягнеться граф і список типів пристроїв.
2. В **лівій панелі** клацніть тип пристрою, щоб додати вузол на полотно.
3. **Подвійний клік на вузол** → відкриється **права панель** редагування (назва, порти).
4. Перетягніть вузол мишею, щоб змінити позицію.
5. З'єднайте **вихідний порт** (зелений, правий) з **вхідним портом** (блакитний, лівий) іншого вузла.
6. Клік на ребро → виділення; клавіша **Delete** видаляє виділений вузол.
7. Натисніть **"Зберегти в БД"** — увесь граф запишеться у PostgreSQL.
8. **"Експорт JSON"** — завантажить граф як файл для бекапу.

## Структура проекту

```
graph/
├── backend/
│   ├── main.py            FastAPI app + CORS + lifespan
│   ├── database.py        asyncpg connection pool
│   ├── models.py          Pydantic схеми
│   ├── routers/
│   │   ├── graph.py       GET/POST /api/graph
│   │   ├── devices.py     CRUD /api/devices, /api/device-types
│   │   ├── ports.py       CRUD /api/ports
│   │   └── connections.py CRUD /api/connections
│   ├── init.sql           DDL + seed
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── api/client.ts          HTTP клієнт
    │   ├── store/graphStore.ts    Zustand store
    │   ├── types/graph.ts         TypeScript типи
    │   └── components/
    │       ├── GraphEditor.tsx    Головне полотно React Flow
    │       ├── nodes/
    │       │   ├── DeviceNode.tsx Кастомний вузол з портами
    │       │   └── NodeTypes.ts   Реєстрація типів
    │       └── panels/
    │           ├── Toolbar.tsx    Ліва панель (додавання пристроїв)
    │           ├── NodeEditor.tsx Права панель (редагування вузла)
    │           └── SavePanel.tsx  Нижня панель (збереження)
    ├── index.html
    ├── vite.config.ts
    └── package.json
```

## API

| Метод | URL | Опис |
|-------|-----|------|
| GET | `/api/graph` | Отримати весь граф |
| POST | `/api/graph` | Зберегти (upsert) весь граф |
| GET | `/api/device-types` | Список типів пристроїв |
| GET | `/api/devices` | Список пристроїв |
| POST | `/api/devices` | Створити пристрій |
| PUT | `/api/devices/{id}` | Оновити пристрій |
| DELETE | `/api/devices/{id}` | Видалити пристрій |
| POST | `/api/ports` | Додати порт |
| PUT | `/api/ports/{id}` | Оновити порт |
| DELETE | `/api/ports/{id}` | Видалити порт |
| POST | `/api/connections` | Додати з'єднання |
| DELETE | `/api/connections/{id}` | Видалити з'єднання |
