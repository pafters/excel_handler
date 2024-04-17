FROM node:latest

# Устанавливаем рабочую директорию внутри контейнера
WORKDIR /app

# Копируем package.json и package-lock.json для установки зависимостей
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install --force

# Копируем все остальные файлы в рабочую директорию
COPY . .

# Запускаем React-приложение
CMD ["npm", "start"]