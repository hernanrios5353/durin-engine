import { z } from 'zod';

export const EquipmentTypeEnum = z.enum(['CAMION', 'EXCAVADORA', 'PERFORADORA']);

export const createEquipmentSchema = z.object({
  code: z.string().min(1, 'El código es obligatorio').max(50),
  name: z.string().min(1, 'El nombre es obligatorio').max(200),
  type: EquipmentTypeEnum,
  currentHourmeter: z.number().min(0, 'El horómetro no puede ser negativo'),
  lastMaintenanceHourmeter: z.number().min(0, 'El horómetro no puede ser negativo'),
  maintenanceInterval: z.number().positive('El intervalo debe ser positivo'),
});

export const updateEquipmentSchema = createEquipmentSchema.partial();

export type CreateEquipmentInput = z.infer<typeof createEquipmentSchema>;
export type UpdateEquipmentInput = z.infer<typeof updateEquipmentSchema>;
