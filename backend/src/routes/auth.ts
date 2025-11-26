import { Router } from 'express';
import { celebrate } from 'celebrate';
import {
  login,
  register,
  logout,
  refreshAccessToken,
  getCurrentUser,
} from '../controllers/auth';
import { validateLogin, validateRegister } from '../middlewares/validations';
import { authenticateToken } from '../middlewares/auth';

const authRouter = Router();

authRouter.post('/auth/login', celebrate(validateLogin), login);
authRouter.post('/auth/register', celebrate(validateRegister), register);
authRouter.get('/auth/token', refreshAccessToken);
authRouter.get('/auth/logout', logout);
authRouter.get('/auth/user', authenticateToken, getCurrentUser);

export default authRouter;
