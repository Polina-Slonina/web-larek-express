import { Router } from 'express';
import { getProducts, createProduct } from '../controllers/products';

const productRouter = Router();

productRouter.get('/product', getProducts);
productRouter.post('/product', createProduct);

export default productRouter;
