import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller.js';

export const dashboardRouter = Router();

dashboardRouter.get('/summary', dashboardController.summary);
dashboardRouter.get('/maintenance-status', dashboardController.maintenanceStatus);