import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { prisma } from './config/database.js';
import { equipmentRouter } from './routes/equipment.routes.js';
import { maintenanceRouter } from './routes/maintenance.routes.js';
import { dashboardRouter } from './routes/dashboard.routes.js';
import { maintenanceController } from './controllers/maintenance.controller.js';

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(express.json());

// Rate limit global: 100 req / 15 min por IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes, intenta de nuevo más tarde' },
});

app.use('/api', limiter);

app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
    });
  }
});

app.get('/api/equipment/:id/maintenance', maintenanceController.listByEquipment);

app.use('/api/equipment', equipmentRouter);
app.use('/api/maintenance', maintenanceRouter);
app.use('/api/dashboard', dashboardRouter);