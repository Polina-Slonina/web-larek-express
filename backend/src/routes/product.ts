import { Router } from 'express';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductById,
} from '../controllers/products';
import { validateObjectId, validateProduct } from '../middlewares/validations';
import { celebrate } from 'celebrate';
import { authenticateToken } from '../middlewares/auth';

const productRouter = Router();

productRouter.get('/product', getProducts);
productRouter.post('/product', celebrate(validateProduct), createProduct);
productRouter.get('/product/:id', celebrate(validateObjectId), getProductById);
productRouter.post('/product', authenticateToken, celebrate(validateProduct), createProduct);
productRouter.patch('/product/:id', authenticateToken, celebrate(validateObjectId), updateProduct);
productRouter.delete('/product/:id', authenticateToken, celebrate(validateObjectId), deleteProduct);

export default productRouter;
