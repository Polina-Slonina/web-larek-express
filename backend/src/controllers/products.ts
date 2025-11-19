import { NextFunction, Request, Response } from 'express';
import product from '../models/product';
import BadRequestError from '../errors/bad-request-error';
import ConflictError from '../errors/conflict-error';

export const getProducts = (_req: Request, res: Response, next: NextFunction) => product.find({})
  .then((products) => res.status(200).send({
    items: products,
    total: products.length,
  }))
  .catch(() => next(new Error('Ошибка при получении товаров')));

export const createProduct = (req: Request, res: Response, next: NextFunction) => {
  const {
    title,
    image,
    category,
    description,
    price,
  } = req.body;

  // Валидация обязательных полей
  if (!title || !image || !category) {
    return next(new BadRequestError('Поля title, image и category обязательны'));
  }

  // Валидация структуры image
  if (!image.fileName || !image.originalName) {
    return next(new BadRequestError('Поля image.fileName и image.originalName обязательны'));
  }
  return product.create({
    title, image, category, description, price,
  })
    .then((createdProduct) => res.status(201).send({
      items: [createdProduct],
      total: 1,
    }))
    .catch((error) => {
      // Обработка ошибки дублирования
      if (error.code === 11000) {
        return next(new ConflictError('Товар с таким названием уже существует'));
      }

      // Ошибки валидации Mongoose
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map((err: any) => err.message);
        return next(new BadRequestError('Ошибка валидации данных при создании товара'));
      }

    // Все остальные ошибки передаем в централизованный обработчик
    return next(error);
    });
};
