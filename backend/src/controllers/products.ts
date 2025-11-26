import { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import product from '../models/product';
import NotFoundError from '../errors/not-found-error';
import { moveFile, cleanupTempFile } from './upload';
import path from 'path';

export const getProducts = (_req: Request, res: Response, next: NextFunction) => product.find({})
  .then((products) => res.status(200).send({
    items: products,
    total: products.length,
  }))
  .catch(() => next(new Error('Ошибка при получении товаров')));

  export const getProductById = (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  return product.findById(id)
    .then((foundProduct) => {
      if (!foundProduct) {
        throw new NotFoundError('Товар не найден');
      }
      res.status(200).send(foundProduct);
    })
    .catch(next);
};

export const createProduct = (req: Request, res: Response, next: NextFunction) => {
  const {
    title,
    image,
    category,
    description,
    price,
  } = req.body;

  let permanentImagePath = '';

  const tempFilePath = path.join(__dirname, '..', 'public', image.fileName);
  permanentImagePath = moveFile(tempFilePath);

  return product.create({
    title: title?.trim(),
    image: {
      fileName: permanentImagePath,
      originalName: image?.originalName?.trim(),
    },
    category: category?.trim(),
    description: description?.trim() || '',
    price: price || null,
  })
    .then((createdProduct) => {
      res.status(201).send(createdProduct)})
    .catch((error) => {
      // Если произошла ошибка, удаляем перемещенный файл
      if (permanentImagePath) {
        cleanupTempFile(permanentImagePath);
      }
      // ошибки передаем в централизованный обработчик
      return next(error);
    });
};

export const updateProduct = (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const {
    title,
    image,
    category,
    description,
    price,
  } = req.body;

  let permanentImagePath = '';
  let oldImagePath = '';

  // Находим текущий товар для получения старого изображения
  product.findById(id)
    .then((existingProduct) => {
      if (!existingProduct) {
        throw new NotFoundError('Товар не найден');
      }

      oldImagePath = existingProduct.image.fileName;

      // Если передано новое изображение, обрабатываем его
      if (image && image.fileName && image.originalName) {
        // Проверяем, является ли это новым файлом (находится во временной папке)
        if (image.fileName.includes('/uploads/temp/')) {
          const tempFilePath = path.join(__dirname, '..', 'public', image.fileName);
          permanentImagePath = moveFile(tempFilePath);
        } else {
          // Если это уже постоянный путь, используем его
          permanentImagePath = image.fileName;
        }
      }

      // Подготавливаем данные для обновления
      const updateData: any = {
        title: title?.trim(),
        category: category?.trim(),
        description: description?.trim() || '',
        price: price || null,
      };

      // Если есть новое изображение, добавляем его в обновление
      if (permanentImagePath) {
        updateData.image = {
          fileName: permanentImagePath,
          originalName: image.originalName.trim(),
        };
      }

      return product.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true },
      );
    })
    .then((updatedProduct) => {
      if (!updatedProduct) {
        throw new NotFoundError('Товар не найден');
      }

      // Если было загружено новое изображение, удаляем старое
      if (permanentImagePath && oldImagePath && permanentImagePath !== oldImagePath) {
        try {
          const oldImageFullPath = path.join(__dirname, '..', 'public', oldImagePath);
          if (fs.existsSync(oldImageFullPath)) {
            fs.unlinkSync(oldImageFullPath);
          }
        } catch (error) {
          console.error('Ошибка при удалении старого изображения:', error);
        }
      }

      res.status(200).send(updatedProduct);
    })
    .catch((error) => {
      // Если произошла ошибка, удаляем перемещенный файл
      if (permanentImagePath && permanentImagePath.includes('/images/')) {
        cleanupTempFile(permanentImagePath);
      }
      return next(error);
    });
};

export const deleteProduct = (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  product.findByIdAndDelete(id)
    .then((deletedProduct) => {
      if (!deletedProduct) {
        throw new NotFoundError('Товар не найден');
      }
      res.status(200).send({ message: 'Товар успешно удален' });
    })
    .catch(next);
};
