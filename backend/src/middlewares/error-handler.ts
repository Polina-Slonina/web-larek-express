import { Request, Response, NextFunction } from 'express';
import { Error as MongooseError } from 'mongoose';
import NotFoundError from '../errors/not-found-error';
import BadRequestError from '../errors/bad-request-error';
import ConflictError from '../errors/conflict-error';

export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  // Если это кастомная ошибка (имеет statusCode)
  // Если это наши кастомные ошибки
  if (error instanceof NotFoundError) {
    return res.status(error.statusCode).json({
      message: error.message,
    });
  }

  if (error instanceof BadRequestError) {
    return res.status(error.statusCode).json({
      message: error.message,
    });
  }

  if (error instanceof ConflictError) {
    return res.status(error.statusCode).json({
      message: error.message,
    });
  }

  // Обработка ошибок Mongoose ValidationError
  if (error instanceof MongooseError.ValidationError) {
    return res.status(400).json({
      message: 'Ошибка валидации данных при создании товара',
    });
  }

  // Обработка ошибок Mongoose CastError (неверный ID формат)
  if (error instanceof MongooseError.CastError) {
    return res.status(400).json({
      message: 'Неверный формат идентификатора',
    });
  }

  // Обработка ошибки дублирования MongoDB
  if (error instanceof Error && error.message.includes('E11000')) {
    return res.status(409).json({
      message: 'Товар с таким названием уже существует',
    });
  }

  // Все остальные ошибки (включая обычные Error) - 500
  // console.error('Внутренняя ошибка сервера:', error);
  return res.status(500).json({
    message: 'Внутренняя ошибка сервера',
  });
};

// Middleware для обработки 404 ошибок
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction) => {
  next(new NotFoundError(`Маршрут не найден: ${req.method} ${req.path}`));
};
