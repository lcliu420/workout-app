import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { profileRouter } from './modules/profile/profile.routes.js';
import { trainingRouter } from './modules/training/training.routes.js';
import { errorHandler } from './middleware/error-handler.js';

const app = express();

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: false,
  }),
);
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRouter);
app.use('/api/profile', profileRouter);
app.use('/api/training', trainingRouter);

app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`Backend listening on http://127.0.0.1:${env.PORT}`);
});
