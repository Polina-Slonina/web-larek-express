import { NextFunction, Request, Response } from 'express';
import { faker } from '@faker-js/faker';

// POST /order - создание заказа
export const createOrder = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { calculatedTotal } = res.locals as { calculatedTotal: number };

    const orderId = faker.string.uuid();

    return res.status(201).json({
      id: orderId,
      total: calculatedTotal,
    });
  } catch (error) {
    // Любая непредвиденная ошибка передается в централизованный обработчик
    return next(error);
  }
};

export default createOrder;
