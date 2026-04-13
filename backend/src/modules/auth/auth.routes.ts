import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { loginSchema, registerSchema } from './auth.schemas.js';
import { getCurrentUser, login, register } from './auth.service.js';

export const authRouter = Router();

authRouter.post('/register', async (request, response, next) => {
  try {
    const input = registerSchema.parse(request.body);
    const result = await register(input);
    response.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

authRouter.post('/login', async (request, response, next) => {
  try {
    const input = loginSchema.parse(request.body);
    const result = await login(input);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

authRouter.get('/me', requireAuth, async (request, response, next) => {
  try {
    const result = await getCurrentUser(request.user!.id, request.user!.email);
    response.json(result);
  } catch (error) {
    next(error);
  }
});
