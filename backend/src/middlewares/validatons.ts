import { Request, Response, NextFunction } from 'express';
import validator from 'validator';
import { Joi } from 'celebrate';
import product from '../models/product';
import BadRequestError from '../errors/bad-request-error';
import NotFoundError from '../errors/not-found-error';

export const validateProduct = {
  body: Joi.object({
    title: Joi.string().min(2).max(30).required(),
    image: Joi.object({
      fileName: Joi.string().required(),
      originalName: Joi.string().required()
    }).required(),
    category: Joi.string().required(),
    description: Joi.string().optional(),
    price: Joi.number().allow(null).optional().default(null)
  })
};

export const validateOrder = {
  body: Joi.object({
    payment: Joi.string().valid('card', 'online').required(),
    email: Joi.string().email().required(),
    phone: Joi.string().required(),
    address: Joi.string().required(),
    total: Joi.number().positive().required(),
    items: Joi.array().items(Joi.string().hex().length(24)).min(1).required()
  })
};

export const validateObjectId = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required()
      .messages({
        'string.hex': 'Неверный формат идентификатора',
        'string.length': 'Неверный формат идентификатора',
        'any.required': 'Идентификатор обязателен'
      })
  })
};

// Валидация обязательных полей
export const validateRequiredFields = (req: Request, res: Response, next: NextFunction) => {
  const {
    payment,
    email,
    phone,
    address,
    total,
    items,
  } = req.body;

  const requiredFields = {
    payment,
    email,
    phone,
    address,
    total,
    items,
  };
  const missingField = Object.entries(requiredFields)
    .find(([_field, value]) => {
      if (value === undefined || value === null || value === '') {
        return true;
      }
      return false;
    });

  if (missingField) {
    return next(new BadRequestError(`Поле ${missingField[0]} обязательно для заполнения`));
  }

  return next();
};

// Валидация типов данных
export const validateDataTypes = (req: Request, res: Response, next: NextFunction) => {
  const {
    payment,
    email,
    phone,
    address,
    total,
    items,
  } = req.body;

  // Валидация payment
  if (!validator.isIn(payment, ['card', 'online'])) {
    return next(new BadRequestError('Ошибка валидации данных'));
  }

  // Валидация email
  if (!validator.isEmail(email)) {
     return next(new BadRequestError('Ошибка валидации данных'));
  }

  // Валидация phone
  if (typeof phone !== 'string') {
    return next(new BadRequestError('Ошибка валидации данных'));
  }

  // Валидация address
  if (typeof address !== 'string') {
    return next(new BadRequestError('Ошибка валидации данных'));
  }

  // Валидация total
  if (!validator.isFloat(total.toString(), { gt: 0 })) {
    return next(new BadRequestError('Ошибка валидации данных'));
  }

  // Валидация items
  if (!Array.isArray(items) || items.length === 0) {
    return next(new BadRequestError('Ошибка валидации данных'));
  }

  return next();
};

// Проверка существования товаров в базе
export const validateProductsExist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { items } = req.body;

    const existingProducts = await product.find({ _id: { $in: items } });

    if (existingProducts.length !== items.length) {
      const foundIds = existingProducts.map((prod) => prod._id.toString());
      const missingIds = items.filter((id: string) => !foundIds.includes(id));
      return next(new NotFoundError(`Товары не найдены: ${missingIds.join(', ')}`));
    }

    // Сохраняем товары в request для следующих middleware
    res.locals.existingProducts = existingProducts;
    return next();
  } catch (error) {
    return next(error);
  }
};

// Проверка доступности товаров price не null
export const validateProductsAvailable = (_req: Request, res: Response, next: NextFunction) => {
  const { existingProducts } = res.locals;

  if (!existingProducts) {
    return next(new Error('Ошибка: данные о товарах не переданы')); //подумать ош 500
  }

  const unavailableProducts = existingProducts.filter((prod: any) => prod.price === null);

  if (unavailableProducts.length > 0) {
    const unavailableIds = unavailableProducts.map((prod: any) => prod._id.toString());
    return next(new BadRequestError(`Товары недоступны для покупки: ${unavailableIds.join(', ')}`));
  }

  return next();
};

// Сверка суммы заказа
export const validateOrderTotal = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { total } = req.body;
    const { existingProducts } = res.locals;

    if (!existingProducts) {
      return next(new Error('Ошибка: данные о товарах не переданы')); //подумать ош 500
    }

    // Считаем общую сумму товаров
    const calculatedTotal = existingProducts.reduce(
      (sum: number, prod: any) => sum + prod.price,
      0,
    );

    // Проверка соответствия суммы заказа
    if (Math.abs(calculatedTotal - total) > 0.01) {
      return next(new BadRequestError(`Сумма заказа не совпадает. Ожидалось: ${calculatedTotal}, получено: ${total}`));
    }

    // Сохраняем пересчитанную сумму в res.locals
    res.locals.calculatedTotal = calculatedTotal;
    return next();
  } catch (error) {
     return next(error);
  }
};
