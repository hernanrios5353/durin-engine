import type { Request, Response } from 'express';
import { prisma } from '../config/database.js';

export const dashboardController = {
  async summary(_req: Request, res: Response) {
    try {
      const [equipment, maintenanceCount] = await Promise.all([
        prisma.equipment.findMany(),
        prisma.maintenance.count(),
      ]);

      const totalEquipment = equipment.length;
      const operationalEquipment = equipment.filter(
        (e) => e.currentHourmeter - e.lastMaintenanceHourmeter < e.maintenanceInterval
      ).length;
      const requiresMaintenance = totalEquipment - operationalEquipment;

      const byType = equipment.reduce((acc, e) => {
        acc[e.type] = (acc[e.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const recentMaintenances = await prisma.maintenance.findMany({
        take: 5,
        orderBy: { maintenanceDate: 'desc' },
        include: { equipment: { select: { code: true, name: true, type: true } } },
      });

      res.json({
        data: {
          totalEquipment,
          operationalEquipment,
          requiresMaintenance,
          totalMaintenanceRecords: maintenanceCount,
          byType,
          recentMaintenances,
        },
      });
    } catch {
      res.status(500).json({ error: 'Error al obtener resumen del dashboard' });
    }
  },

  async maintenanceStatus(_req: Request, res: Response) {
    try {
      const equipment = await prisma.equipment.findMany({
        orderBy: { currentHourmeter: 'desc' },
      });

      const withStatus = equipment.map((e) => {
        const hoursSinceLastMaintenance = e.currentHourmeter - e.lastMaintenanceHourmeter;
        const remaining = e.maintenanceInterval - hoursSinceLastMaintenance;
        return {
          id: e.id,
          code: e.code,
          name: e.name,
          type: e.type,
          currentHourmeter: e.currentHourmeter,
          lastMaintenanceHourmeter: e.lastMaintenanceHourmeter,
          maintenanceInterval: e.maintenanceInterval,
          hoursSinceLastMaintenance,
          remainingHours: remaining,
          status: remaining <= 0 ? 'REQUIERE_MANTENIMIENTO' : 'OPERATIVO',
        };
      });

      res.json({ data: withStatus });
    } catch {
      res.status(500).json({ error: 'Error al obtener estado de mantenimiento' });
    }
  },
};