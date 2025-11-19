import { Router } from 'express';
import productRouter from './product';
import orderRouter from './order';

const router = Router();

router.use('/', productRouter);
router.use('/', orderRouter);

export default router;
