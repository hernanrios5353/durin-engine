import { prisma } from '../config/database.js';
import type { CreateEquipmentInput, UpdateEquipmentInput } from '../validators/equipment.validator.js';

export type EquipmentStatus = 'OPERATIVO' | 'REQUIERE_MANTENIMIENTO';

export interface EquipmentWithStatus {
  id: string;
  code: string;
  name: string;
  type: string;
  currentHourmeter: number;
  lastMaintenanceHourmeter: number;
  maintenanceInterval: number;
  status: EquipmentStatus;
  hoursSinceLastMaintenance: number;
  createdAt: Date;
  updatedAt: Date;
}

function calculateStatus(equipment: {
  currentHourmeter: number;
  lastMaintenanceHourmeter: number;
  maintenanceInterval: number;
}): { status: EquipmentStatus; hoursSinceLastMaintenance: number } {
  const hoursSinceLastMaintenance =
    equipment.currentHourmeter - equipment.lastMaintenanceHourmeter;

  const status: EquipmentStatus =
    hoursSinceLastMaintenance >= equipment.maintenanceInterval
      ? 'REQUIERE_MANTENIMIENTO'
      : 'OPERATIVO';

  return { status, hoursSinceLastMaintenance };
}

function withStatus<T extends {
  currentHourmeter: number;
  lastMaintenanceHourmeter: number;
  maintenanceInterval: number;
}>(equipment: T): T & { status: EquipmentStatus; hoursSinceLastMaintenance: number } {
  return { ...equipment, ...calculateStatus(equipment) };
}

export const equipmentService = {
  async findAll(filters?: { type?: string; status?: string; code?: string }) {
    const where: Record<string, unknown> = {};

    if (filters?.type) where.type = filters.type;
    if (filters?.code) {
      where.code = { contains: filters.code, mode: 'insensitive' };
    }

    const equipment = await prisma.equipment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const withStatuses = equipment.map(withStatus);

    if (filters?.status) {
      return withStatuses.filter((e) => e.status === filters.status);
    }

    return withStatuses;
  },

  async findById(id: string) {
    const equipment = await prisma.equipment.findUnique({ where: { id } });
    if (!equipment) return null;
    return withStatus(equipment);
  },

  async create(data: CreateEquipmentInput) {
    const existing = await prisma.equipment.findUnique({ where: { code: data.code } });
    if (existing) {
      throw new Error('DUPLICATE_CODE');
    }

    if (data.currentHourmeter < data.lastMaintenanceHourmeter) {
      throw new Error('INVALID_HOURMETER');
    }

    const equipment = await prisma.equipment.create({ data });
    return withStatus(equipment);
  },

  async update(id: string, data: UpdateEquipmentInput) {
    const existing = await prisma.equipment.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('NOT_FOUND');
    }

    if (data.code && data.code !== existing.code) {
      const duplicate = await prisma.equipment.findUnique({ where: { code: data.code } });
      if (duplicate) throw new Error('DUPLICATE_CODE');
    }

    if (
      data.currentHourmeter !== undefined &&
      data.currentHourmeter < existing.currentHourmeter
    ) {
      throw new Error('HOURMETER_CANNOT_DECREASE');
    }

    const updated = await prisma.equipment.update({ where: { id }, data });
    return withStatus(updated);
  },

  async delete(id: string) {
    const existing = await prisma.equipment.findUnique({ where: { id } });
    if (!existing) throw new Error('NOT_FOUND');
    await prisma.equipment.delete({ where: { id } });
  },
};