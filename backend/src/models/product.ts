import mongoose, { Schema, Document } from 'mongoose';
import fs from 'fs';
import path from 'path';

interface IProduct {
  title: string;
  image: {
    fileName: string;
    originalName: string;
  };
  category: string;
  description?: string;
  price?: number | null;
}

export const productSchema = new mongoose.Schema<IProduct>({
  title: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 30,
    unique: true,
    trim: true, // удаление пробелов в начале и конце строки
  },
  image: {
    fileName: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
  },
  category: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  price: {
    type: Number,
    required: false,
    default: null,
  },
});

// Middleware для удаления файлов изображений при удалении товара
productSchema.post('findOneAndDelete', async function(doc: IProduct) {
  if (doc && doc.image && doc.image.fileName) {
    try {
      const filePath = path.join(__dirname, '..', 'uploads', doc.image.fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Ошибка при удалении файла изображения:', error);
    }
  }
});

// Создание и экспорт модели
export default mongoose.model<IProduct>('product', productSchema);
