import { Request, Response, NextFunction, CookieOptions } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user';
import BadRequestError from '../errors/bad-request-error';
import UnauthorizedError from '../errors/unauthorized-error';
import NotFoundError from '../errors/not-found-error';
import { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET, ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY  } from '../config';

const ms = require('ms')

export interface TokenPayload {
  _id: string;
}

// Генерация токенов
const generateTokens = (userId: string): { accessToken: string; refreshToken: string } => {
  const payload = { _id: userId };

  const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  } as jwt.SignOptions);
  const refreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  } as jwt.SignOptions);

  return { accessToken, refreshToken };
};

// Установка refreshToken в куки
const setRefreshTokenCookie = (res: Response, refreshToken: string) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: ms(process.env.AUTH_REFRESH_TOKEN_EXPIRY || '7d'),
    path: '/',
  } as CookieOptions);
};

// Получение текущего пользователя
export const getCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user || !req.user._id) {
      return next(new UnauthorizedError('Пользователь не аутентифицирован'));
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return next(new NotFoundError('Пользователь не найден'));
    }

    res.status(200).json({
      user: {
        email: user.email,
        name: user.name,
      },
      success: true,
    });
  } catch (error) {
    next(error);
  }
};

// Аутентификация пользователя
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    // Ищем пользователя с паролем (используем select('+password'))
    const user = await User.findOne({ email }).select('+password +tokens');

    if (!user || !(await user.comparePassword(password))) {
      return next(new UnauthorizedError('Неверная почта или пароль'));
    }

    // Генерируем токены
    const { accessToken, refreshToken } = generateTokens(user._id.toString());

    // Добавляем refreshToken в массив токенов пользователя
    user.tokens.push({ token: refreshToken });
    await user.save();

    // Устанавливаем refreshToken в куки
    setRefreshTokenCookie(res, refreshToken);

    const response = {
      user: {
        email: user.email,
        name: user.name,
      },
      success: true,
      accessToken,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Регистрация пользователя
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password } = req.body;

    // Создаем пользователя
    const user = await User.create({
      name,
      email,
      password,
    });

    // Генерируем токены
    const { accessToken, refreshToken } = generateTokens(user._id.toString());

    // Добавляем refreshToken в массив токенов пользователя
    user.tokens.push({ token: refreshToken });
    await user.save();

    // Устанавливаем refreshToken в куки
    setRefreshTokenCookie(res, refreshToken);

    const response = {
      user: {
        email: user.email,
        name: user.name,
      },
      success: true,
      accessToken,
    };

    res.status(201).json(response);
  } catch (error: any) {
    return next(error);
  }
};

// Выход пользователя
export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return next(new BadRequestError('Refresh token отсутствует'));
    }

    // Валидируем токен
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as TokenPayload;

    // Находим пользователя и удаляем токен
    const user = await User.findById(decoded._id).select('+tokens');

    if (!user) {
      // Очищаем куку даже если пользователь не найден
      res.clearCookie('refreshToken');
      return next(new NotFoundError('Пользователь не найден'));
    }

    // Удаляем токен из массива
    user.tokens = []; // Очищаем весь массив токенов
    await user.save();

    // Очищаем куку
    res.clearCookie('refreshToken');

    res.status(200).json({
      success: true,
    });
  } catch (error) {
    // В случае ошибки все равно очищаем куку
    res.clearCookie('refreshToken');
    next(error);
  }
};

// Обновление access токена
export const refreshAccessToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return next(new UnauthorizedError('Refresh token отсутствует'));
    }

    // Валидируем refresh token
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as TokenPayload;

    // Находим пользователя с токенами
    const user = await User.findById(decoded._id).select('+tokens');

    if (!user) {
      return next(new NotFoundError('Пользователь не найден'));
    }

    // Проверяем, существует ли токен в базе
    const tokenExists = user.tokens.some(tokenObj => tokenObj.token === refreshToken);
    if (!tokenExists) {
      return next(new UnauthorizedError('Недействительный refresh token'));
    }

    // Генерируем новую пару токенов
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens(user._id.toString());

    // Заменяем старый refresh token на новый
    user.tokens = user.tokens.filter(tokenObj => tokenObj.token !== refreshToken);
    user.tokens.push({ token: newRefreshToken });
    await user.save();

    // Устанавливаем новый refresh token в куки
    setRefreshTokenCookie(res, newRefreshToken);

    const response = {
      user: {
        email: user.email,
        name: user.name,
      },
      success: true,
      accessToken: newAccessToken,
    };

    res.status(200).json(response);
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      // Очищаем куку при невалидном токене
      res.clearCookie('refreshToken');
      return next(new UnauthorizedError('Недействительный или просроченный токен'));
    }
    next(error);
  }
};
