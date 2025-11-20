import { Router } from 'express';
import { celebrate } from 'celebrate';
import { createOrder } from '../controllers/order';
import {
  validateRequiredFields,
  validateDataTypes,
  validateProductsExist,
  validateProductsAvailable,
  validateOrderTotal,
  validateOrder,
} from '../middlewares/validatons';

const orderRouter = Router();

orderRouter.post(
  '/order',
  celebrate(validateOrder),
  validateRequiredFields,
  validateDataTypes,
  validateProductsExist,
  validateProductsAvailable,
  validateOrderTotal,
  createOrder,
);

export default orderRouter;
