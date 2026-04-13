import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { getTrainingOverview, saveCurrentWeek, saveWeekById } from './training.service.js';
import { saveCurrentWeekSchema } from './training.schemas.js';

export const trainingRouter = Router();

trainingRouter.get('/weeks', requireAuth, async (request, response, next) => {
  try {
    const result = await getTrainingOverview(request.user!.id);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

trainingRouter.put('/weeks/current', requireAuth, async (request, response, next) => {
  try {
    const input = saveCurrentWeekSchema.parse(request.body);
    const result = await saveCurrentWeek(request.user!.id, input);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

trainingRouter.put('/weeks/:weekId', requireAuth, async (request, response, next) => {
  try {
    const input = saveCurrentWeekSchema.parse(request.body);
    const weekId = Array.isArray(request.params.weekId)
      ? request.params.weekId[0]
      : request.params.weekId;
    const result = await saveWeekById(request.user!.id, weekId, input);
    response.json(result);
  } catch (error) {
    next(error);
  }
});
