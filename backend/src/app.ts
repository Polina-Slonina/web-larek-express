import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import path from 'path';
import router from './routes/index';
import { errors } from 'celebrate';
import {errorHandler, notFoundHandler} from './middlewares/error-handler';
import { errorLogger, requestLogger } from './middlewares/logger';
import cleanupTempFiles from './controllers/cleanupTempFiles';

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.DB_ADDRESS;

const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
};

// Middleware
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));

app.use(requestLogger);

app.use('/', router);

// Валидация celebrate
app.use(errors());

// Логгер ошибок
app.use(errorLogger);

// Обработка 404 ошибок
app.use('*', notFoundHandler);

// Централизованный обработчик ошибок
app.use(errorHandler);

cleanupTempFiles();

// Подключение к MongoDB
mongoose.connect(`${MONGODB_URI}`);

app.listen(PORT, () => console.log(`listening on port ${PORT}`));

export default app;
