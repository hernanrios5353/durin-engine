import type { Request, Response } from 'express';
import { equipmentService } from '../services/equipment.service.js';
import {
  createEquipmentSchema,
  updateEquipmentSchema,
} from '../validators/equipment.validator.js';

export const equipmentController = {
  async list(req: Request, res: Response) {
    try {
      const { type, status, code } = req.query;
      const equipment = await equipmentService.findAll({
        type: type as string | undefined,
        status: status as string | undefined,
        code: code as string | undefined,
      });
      res.json({ data: equipment, total: equipment.length });
    } catch (error) {
      res.status(500).json({ error: 'Error al listar equipos' });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const equipment = await equipmentService.findById(req.params.id as string);
      if (!equipment) {
        return res.status(404).json({ error: 'Equipo no encontrado' });
      }
      res.json({ data: equipment });
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener equipo' });
    }
  },

  async create(req: Request, res: Response) {
    const parsed = createEquipmentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: parsed.error.issues,
      });
    }

    try {
      const equipment = await equipmentService.create(parsed.data);
      res.status(201).json({ data: equipment });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'DUPLICATE_CODE') {
          return res.status(409).json({ error: 'El código ya existe' });
        }
        if (error.message === 'INVALID_HOURMETER') {
          return res
            .status(400)
            .json({ error: 'El horómetro actual no puede ser menor que el del último mantenimiento' });
        }
      }
      res.status(500).json({ error: 'Error al crear equipo' });
    }
  },

  async update(req: Request, res: Response) {
    const parsed = updateEquipmentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: parsed.error.issues,
      });
    }

    try {
      const equipment = await equipmentService.update(req.params.id as string, parsed.data);
      res.json({ data: equipment });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'NOT_FOUND') {
          return res.status(404).json({ error: 'Equipo no encontrado' });
        }
        if (error.message === 'DUPLICATE_CODE') {
          return res.status(409).json({ error: 'El código ya existe' });
        }
        if (error.message === 'HOURMETER_CANNOT_DECREASE') {
          return res.status(400).json({ error: 'El horómetro no puede disminuir' });
        }
      }
      res.status(500).json({ error: 'Error al actualizar equipo' });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      await equipmentService.delete(req.params.id as string);
      res.status(204).send();
    } catch (error) {
      if (error instanceof Error && error.message === 'NOT_FOUND') {
        return res.status(404).json({ error: 'Equipo no encontrado' });
      }
      res.status(500).json({ error: 'Error al eliminar equipo' });
    }
  },
};