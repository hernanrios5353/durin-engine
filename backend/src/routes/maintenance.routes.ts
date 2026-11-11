import { Router } from 'express';
import { maintenanceController } from '../controllers/maintenance.controller.js';

export const maintenanceRouter = Router();

maintenanceRouter.get('/', maintenanceController.list);
maintenanceRouter.get('/:id', maintenanceController.getById);
maintenanceRouter.post('/', maintenanceController.create);