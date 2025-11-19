import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
// import productRouter from './routes/product';
// import orderRoutes from './routes/order';
import router from './routes/index';
import {errorHandler, notFoundHandler} from './middlewares/error-handler';

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.DB_ADDRESS;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));  
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', router);
// app.use('/product', productRouter);
// app.use('/', orderRoutes);

// Обработка 404 ошибок - после всех роутов
app.use('*', notFoundHandler);

// Централизованный обработчик ошибок - самый последний
app.use(errorHandler);

// Подключение к MongoDB
mongoose.connect(`${MONGODB_URI}`);

app.listen(PORT, () => console.log(`listening on port ${PORT}`));

export default app;
