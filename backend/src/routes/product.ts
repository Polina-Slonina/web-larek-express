import { Router } from 'express';
import { getProducts, createProduct } from '../controllers/products';
import { validateObjectId, validateProduct } from '../middlewares/validatons';
import { celebrate } from 'celebrate';

const productRouter = Router();

productRouter.get('/product', getProducts);
productRouter.post('/product', celebrate(validateObjectId), celebrate(validateProduct), createProduct);

export default productRouter;
