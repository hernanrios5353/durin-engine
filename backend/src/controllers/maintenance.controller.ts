import type { Request, Response } from 'express';
import { maintenanceService } from '../services/maintenance.service.js';
import { createMaintenanceSchema } from '../validators/maintenance.validator.js';

export const maintenanceController = {
  async list(req: Request, res: Response) {
    try {
      const { equipmentId } = req.query;
      const maintenances = await maintenanceService.findAll({
        equipmentId: equipmentId as string | undefined,
      });
      res.json({ data: maintenances, total: maintenances.length });
    } catch {
      res.status(500).json({ error: 'Error al listar mantenimientos' });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const maintenance = await maintenanceService.findById(req.params.id as string);
      if (!maintenance) {
        return res.status(404).json({ error: 'Mantenimiento no encontrado' });
      }
      res.json({ data: maintenance });
    } catch {
      res.status(500).json({ error: 'Error al obtener mantenimiento' });
    }
  },

  async listByEquipment(req: Request, res: Response) {
    try {
      const maintenances = await maintenanceService.findByEquipment(req.params.id as string);
      res.json({ data: maintenances, total: maintenances.length });
    } catch {
      res.status(500).json({ error: 'Error al listar mantenimientos del equipo' });
    }
  },

  async create(req: Request, res: Response) {
    const parsed = createMaintenanceSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: parsed.error.issues,
      });
    }

    try {
      const maintenance = await maintenanceService.create(parsed.data);
      res.status(201).json({ data: maintenance });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'EQUIPMENT_NOT_FOUND') {
          return res.status(404).json({ error: 'Equipo no encontrado' });
        }
        if (error.message === 'HOURMETER_EXCEEDS_CURRENT') {
          return res.status(400).json({
            error: 'El horómetro registrado no puede superar el horómetro actual del equipo',
          });
        }
        if (error.message === 'HOURMETER_BELOW_LAST') {
          return res.status(400).json({
            error: 'El horómetro registrado no puede ser menor que el último mantenimiento',
          });
        }
      }
      res.status(500).json({ error: 'Error al crear mantenimiento' });
    }
  },
};