# Этап 1: Сборка React приложения
FROM node:18-alpine AS build
WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./
RUN npm install

# Копируем всё остальное и собираем проект
COPY . .
RUN npm run build

# Этап 2: Раздача готовых файлов через Nginx
FROM nginx:stable-alpine
# Копируем билд из первого этапа в папку Nginx
COPY --from=build /app/build /usr/share/nginx/html

# Пробрасываем порт 80 (стандарт для веба)
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]