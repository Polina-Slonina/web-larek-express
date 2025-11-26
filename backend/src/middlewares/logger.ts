import winston from 'winston';
import expressWinston from 'express-winston';

// Логгер запросов
export const requestLogger = expressWinston.logger({
  transports: [
    new winston.transports.File({ filename: 'request.log' }),
  ],
  format: winston.format.json(),
  meta: true,
  msg: 'HTTP {{req.method}} {{req.url}}', // формат сообщения
  expressFormat: true, // формат Express
  colorize: false, // отключаем цвета для файлов
  ignoreRoute: (_req, _res) => false, // логируем все роуты
});

// Логгер ошибок
export const errorLogger = expressWinston.errorLogger({
  transports: [
    new winston.transports.File({ filename: 'error.log' }),
  ],
  format: winston.format.json(),
});
