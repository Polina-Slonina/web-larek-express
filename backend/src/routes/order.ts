import { Router } from 'express';
import { createOrder } from '../controllers/order';
import {
  validateRequiredFields,
  validateDataTypes,
  validateProductsExist,
  validateProductsAvailable,
  validateOrderTotal,
} from '../middlewares/validatons';

const orderRouter = Router();

orderRouter.post(
  '/order',
  validateRequiredFields,
  validateDataTypes,
  validateProductsExist,
  validateProductsAvailable,
  validateOrderTotal,
  createOrder,
);

export default orderRouter;
