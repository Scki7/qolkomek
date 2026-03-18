# 1. Сборка фронтенда
FROM node:18-alpine AS build
WORKDIR /app

# Копируем зависимости
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем весь проект
COPY . .

# ХИТРЫЙ ХОД: Даем права на запуск скриптов
RUN chmod -R +x node_modules/.bin

# Собираем проект (игнорируем ворнинги)
RUN CI=false npm run build

# 2. Раздача через Nginx
FROM nginx:stable-alpine
# Проверь: если папка после сборки называется build, оставляем так. 
# Если используешь Vite и папка dist — замени build на dist ниже.
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]