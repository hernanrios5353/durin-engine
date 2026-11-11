import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { testPrisma, cleanDatabase } from './setup.js';

describe('Maintenance API', () => {
  let equipmentId: string;

  beforeAll(async () => {
    await cleanDatabase();
  });

  beforeEach(async () => {
    await cleanDatabase();

    const res = await request(app).post('/api/equipment').send({
      code: 'MNT-001',
      name: 'Equipo para mantenimiento',
      type: 'EXCAVADORA',
      currentHourmeter: 1000,
      lastMaintenanceHourmeter: 500,
      maintenanceInterval: 500,
    });
    equipmentId = res.body.data.id;
  });

  afterAll(async () => {
    await cleanDatabase();
    await testPrisma.$disconnect();
  });

  describe('POST /api/maintenance', () => {
    it('registra un mantenimiento y actualiza el equipo en una transacción', async () => {
      const res = await request(app).post('/api/maintenance').send({
        equipmentId,
        maintenanceType: 'PREVENTIVO',
        description: 'Cambio de aceite',
        hourmeter: 900,
        observations: 'Sin novedades',
      });

      expect(res.status).toBe(201);
      expect(res.body.data.hourmeter).toBe(900);

      const equipment = await testPrisma.equipment.findUnique({
        where: { id: equipmentId },
      });
      expect(equipment?.lastMaintenanceHourmeter).toBe(900);
      expect(equipment?.currentHourmeter).toBe(1000); // sin cambios
    });

    it('cambia el estado del equipo de REQUIERE_MANTENIMIENTO a OPERATIVO', async () => {
      const antes = await request(app).get(`/api/equipment/${equipmentId}`);
      expect(antes.body.data.status).toBe('REQUIERE_MANTENIMIENTO');

      await request(app).post('/api/maintenance').send({
        equipmentId,
        maintenanceType: 'PREVENTIVO',
        description: 'Mantenimiento completo',
        hourmeter: 1000,
      });

      const despues = await request(app).get(`/api/equipment/${equipmentId}`);
      expect(despues.body.data.status).toBe('OPERATIVO');
      expect(despues.body.data.hoursSinceLastMaintenance).toBe(0);
    });

    it('rechaza hourmeter mayor que currentHourmeter del equipo', async () => {
      const res = await request(app).post('/api/maintenance').send({
        equipmentId,
        maintenanceType: 'PREVENTIVO',
        description: 'Test',
        hourmeter: 1500,
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('superar');
    });

    it('rechaza hourmeter menor que lastMaintenanceHourmeter', async () => {
      const res = await request(app).post('/api/maintenance').send({
        equipmentId,
        maintenanceType: 'PREVENTIVO',
        description: 'Test',
        hourmeter: 300,
      });

      expect(res.status).toBe(400);
    });

    it('rechaza mantenimiento para equipo inexistente', async () => {
      const res = await request(app).post('/api/maintenance').send({
        equipmentId: 'inexistente-123',
        maintenanceType: 'PREVENTIVO',
        description: 'Test',
        hourmeter: 100,
      });

      expect(res.status).toBe(404);
    });

    it('conserva historial: registra 2 mantenimientos sin borrar el primero', async () => {
      await request(app).post('/api/maintenance').send({
        equipmentId,
        maintenanceType: 'PREVENTIVO',
        description: 'Primer mantenimiento',
        hourmeter: 700,
      });

      await request(app).post('/api/maintenance').send({
        equipmentId,
        maintenanceType: 'CORRECTIVO',
        description: 'Segundo mantenimiento',
        hourmeter: 900,
      });

      const historial = await testPrisma.maintenance.findMany({
        where: { equipmentId },
      });

      expect(historial).toHaveLength(2);
      expect(historial.map((m) => m.description)).toContain('Primer mantenimiento');
      expect(historial.map((m) => m.description)).toContain('Segundo mantenimiento');
    });
  });

  describe('GET /api/maintenance', () => {
    it('lista todos los mantenimientos con datos del equipo', async () => {
      await request(app).post('/api/maintenance').send({
        equipmentId,
        maintenanceType: 'PREVENTIVO',
        description: 'Test',
        hourmeter: 800,
      });

      const res = await request(app).get('/api/maintenance');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].equipment.code).toBe('MNT-001');
    });
  });
});