import { z } from 'zod';

export const MaintenanceTypeEnum = z.enum(['PREVENTIVO', 'CORRECTIVO', 'PREDICTIVO']);

export const createMaintenanceSchema = z.object({
  equipmentId: z.string().min(1, 'El equipo es obligatorio'),
  maintenanceType: MaintenanceTypeEnum,
  description: z.string().min(1, 'La descripción es obligatoria').max(1000),
  hourmeter: z.number().min(0, 'El horómetro no puede ser negativo'),
  maintenanceDate: z.string().datetime().optional(),
  observations: z.string().max(2000).optional(),
});

export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>;