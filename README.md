# QolKomek 🟢

Веб-платформа для поиска местных помощников. Заказчики создают задачи, помощники откликаются.

## Стек
- **Frontend**: React, React Router, Axios, @react-google-maps/api
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL

---

## Быстрый старт

### 1. База данных
Создай базу данных PostgreSQL:
```sql
CREATE DATABASE qolkomek;
```

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env
# Заполни .env своими данными
npm run dev
```

`.env` файл:
```
PORT=5000
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/qolkomek
JWT_SECRET=придумай_длинный_секрет
```

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env
# Добавь Google Maps API ключ
npm start
```

`.env` файл:
```
REACT_APP_GOOGLE_MAPS_KEY=твой_ключ_от_google_maps
```

Получить Google Maps API ключ: https://console.cloud.google.com → Включи "Maps JavaScript API"

---

## Структура проекта

```
qolkomek/
├── backend/
│   ├── routes/
│   │   ├── auth.js        # Регистрация / логин / /me
│   │   ├── tasks.js       # CRUD задач, отклики, выбор помощника
│   │   ├── messages.js    # Чат между пользователями
│   │   ├── ratings.js     # Рейтинги после задач
│   │   └── users.js       # Профили, блокировка (admin)
│   ├── middleware/
│   │   └── auth.js        # JWT middleware
│   ├── db.js              # PostgreSQL + авто-создание таблиц
│   └── server.js          # Express entry point
│
└── frontend/
    └── src/
        ├── pages/
        │   ├── Home.js         # Главная + BottomNav
        │   ├── SignIn.js        # Вход
        │   ├── Register.js      # Регистрация
        │   ├── MapPage.js       # Карта задач (Google Maps)
        │   ├── CreateTask.js    # Форма создания задачи
        │   ├── TaskDetail.js    # Детали задачи + отклик
        │   ├── TaskStatus.js    # Статус + завершение
        │   ├── RatingPage.js    # Оценка помощника
        │   ├── ChatPage.js      # Чат
        │   ├── Profile.js       # Профиль пользователя
        │   ├── MyTasks.js       # Список моих задач
        │   └── AdminPanel.js    # Панель админа
        ├── context/
        │   └── AuthContext.js   # Глобальный auth state
        ├── api.js               # Axios instance
        └── index.css            # Глобальные стили
```

---

## API Endpoints

| Method | URL | Описание |
|--------|-----|----------|
| POST | /api/auth/register | Регистрация |
| POST | /api/auth/login | Вход |
| GET | /api/auth/me | Текущий пользователь |
| GET | /api/tasks | Все открытые задачи |
| GET | /api/tasks/my | Мои задачи |
| POST | /api/tasks | Создать задачу |
| GET | /api/tasks/:id | Задача по ID |
| POST | /api/tasks/:id/respond | Откликнуться |
| GET | /api/tasks/:id/responses | Список откликов |
| POST | /api/tasks/:id/select-helper | Выбрать помощника |
| POST | /api/tasks/:id/complete | Завершить задачу |
| DELETE | /api/tasks/:id | Удалить задачу |
| GET | /api/messages/:taskId | Сообщения чата |
| POST | /api/messages/:taskId | Отправить сообщение |
| POST | /api/ratings | Оставить рейтинг |
| GET | /api/users/:id | Профиль пользователя |
| POST | /api/users/:id/block | Заблокировать (admin) |
| POST | /api/users/:id/unblock | Разблокировать (admin) |

---

## Сделать аккаунт администратором

```sql
UPDATE users SET role = 'admin' WHERE email = 'твой@email.com';
```
