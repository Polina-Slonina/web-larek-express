import { Request, Response, NextFunction } from 'express';
import User from '../models/user';
import NotFoundError from '../errors/not-found-error';
import BadRequestError from '../errors/bad-request-error';
import ConflictError from '../errors/conflict-error';
import UnauthorizedError from '../errors/unauthorized-error';

// Создание пользователя
export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password } = req.body;

    // Создаем пользователя
    const user = await User.create({
      name: name || 'Ё-мое',
      email,
      password,
    });

    // Не возвращаем пароль и токены в ответе
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
    };

    return res.status(201).json({
      user: userResponse,
      success: true,
    });
  } catch (error: any) {
    return next(error);
  }
};

// Получение всех пользователей
export const getUsers = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await User.find({}).select('-tokens -password');

    res.status(200).json({
      items: users,
      total: users.length,
      success: true,
    });
  } catch (error) {
    next(error);
  }
};

// Получение пользователя по ID
export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('-tokens -password');

    if (!user) {
      return next(new NotFoundError('Пользователь не найден'));
    }

    return res.status(200).json({
      user,
      success: true,
    });
  } catch (error: any) {
    if (error.name === 'CastError') {
      return next(new BadRequestError('Неверный формат идентификатора пользователя'));
    }
    return next(error);
  }
};

// обновление данных пользователя
export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user || !req.user._id) {
      return next(new UnauthorizedError('Пользователь не аутентифицирован'));
    }

    const { name, email, password } = req.body;
    const userId = req.user._id;

    // Проверяем, что есть хотя бы одно поле для обновления
    if (!name && !email && !password) {
      return next(new BadRequestError('Не указаны данные для обновления'));
    }

    // Подготавливаем объект для обновления
    const updateData: any = {};

    if (name !== undefined) updateData.name = name.trim();
    if (email !== undefined) updateData.email = email.trim();
    if (password !== undefined) {
      if (password.length < 6) {
        return next(new BadRequestError('Пароль должен быть не менее 6 символов'));
      }
      updateData.password = password;
    }

    // Обновляем пользователя
    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      {
        new: true,
        runValidators: true,
      },
    ).select('-password -tokens'); // исключаем пароль и токены

    if (!user) {
      return next(new NotFoundError('Пользователь не найден'));
    }

    // Если менялся пароль - очищаем токены
    let message;
    if (password !== undefined) {
      await User.findByIdAndUpdate(userId, { $set: { tokens: [] } });
      message = 'Пароль изменен. Выполнен выход со всех устройств.';
    }

    const response: any = {
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
      },
      success: true,
    };

    if (message) {
      response.message = message;
    }

    return res.status(200).json(response);
  } catch (error) {
    return next(error);
  }
};
