import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';

export const uploadFile = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: 'Файл не был загружен',
      });
    }

    // Возвращаем информацию о загруженном файле
    return res.status(200).json({
      fileName: `/uploads/temp/${req.file.filename}`,
      originalName: req.file.originalname,
    });
  } catch (error) {
    return next(error);
  }
};

// Функция для перемещения файла из временной директории в постоянную
export const moveFile = (tempFilePath: string): string => {
  const permanentDir = path.join(__dirname, '../public/images');

  // Создаем директорию, если она не существует
  if (!fs.existsSync(permanentDir)) {
    fs.mkdirSync(permanentDir, { recursive: true });
  }

  const fileName = path.basename(tempFilePath);
  const permanentPath = path.join(permanentDir, fileName);

  // Перемещаем файл
  fs.renameSync(tempFilePath, permanentPath);

  return `/images/${fileName}`;
};

// Функция для удаления временных файлов
export const cleanupTempFile = (filePath: string) => {
  const fullPath = path.join(__dirname, '..', filePath);

  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
};
