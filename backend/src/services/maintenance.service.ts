import { prisma } from '../config/database.js';
import type { CreateMaintenanceInput } from '../validators/maintenance.validator.js';

export const maintenanceService = {
  async findAll(filters?: { equipmentId?: string }) {
    const where: Record<string, unknown> = {};
    if (filters?.equipmentId) where.equipmentId = filters.equipmentId;

    return prisma.maintenance.findMany({
      where,
      include: { equipment: { select: { code: true, name: true, type: true } } },
      orderBy: { maintenanceDate: 'desc' },
    });
  },

  async findById(id: string) {
    return prisma.maintenance.findUnique({
      where: { id },
      include: { equipment: { select: { code: true, name: true, type: true } } },
    });
  },

  async findByEquipment(equipmentId: string) {
    return prisma.maintenance.findMany({
      where: { equipmentId },
      orderBy: { maintenanceDate: 'desc' },
    });
  },

  async create(data: CreateMaintenanceInput) {
    return prisma.$transaction(async (tx) => {
      const equipment = await tx.equipment.findUnique({ where: { id: data.equipmentId } });
      if (!equipment) throw new Error('EQUIPMENT_NOT_FOUND');

      if (data.hourmeter > equipment.currentHourmeter) {
        throw new Error('HOURMETER_EXCEEDS_CURRENT');
      }

      if (data.hourmeter < equipment.lastMaintenanceHourmeter) {
        throw new Error('HOURMETER_BELOW_LAST');
      }

      const maintenance = await tx.maintenance.create({
        data: {
          equipmentId: data.equipmentId,
          maintenanceType: data.maintenanceType,
          description: data.description,
          hourmeter: data.hourmeter,
          maintenanceDate: data.maintenanceDate ? new Date(data.maintenanceDate) : new Date(),
          observations: data.observations,
        },
      });

      await tx.equipment.update({
        where: { id: data.equipmentId },
        data: { lastMaintenanceHourmeter: data.hourmeter },
      });

      return maintenance;
    });
  },
};