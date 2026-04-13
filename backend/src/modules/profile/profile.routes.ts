import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requestEmailChangeSchema, updateProfileSchema } from './profile.schemas.js';
import { requestEmailChange, updateProfile } from './profile.service.js';

export const profileRouter = Router();

profileRouter.patch('/', requireAuth, async (request, response, next) => {
  try {
    const input = updateProfileSchema.parse(request.body);
    const result = await updateProfile(request.user!.id, input);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

profileRouter.patch('/email', requireAuth, async (request, response, next) => {
  try {
    const input = requestEmailChangeSchema.parse(request.body);
    const result = await requestEmailChange(request.user!.id, request.user!.accessToken, input);
    response.json(result);
  } catch (error) {
    next(error);
  }
});
