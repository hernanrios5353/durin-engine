import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { testPrisma, cleanDatabase } from './setup.js';

describe('Equipment API', () => {
  beforeAll(async () => {
    await cleanDatabase();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
    await testPrisma.$disconnect();
  });

  describe('POST /api/equipment', () => {
    it('crea un equipo correctamente', async () => {
      const res = await request(app).post('/api/equipment').send({
        code: 'TEST-001',
        name: 'Equipo Test',
        type: 'CAMION',
        currentHourmeter: 100,
        lastMaintenanceHourmeter: 0,
        maintenanceInterval: 250,
      });

      expect(res.status).toBe(201);
      expect(res.body.data.code).toBe('TEST-001');
      expect(res.body.data.status).toBe('OPERATIVO');
      expect(res.body.data.hoursSinceLastMaintenance).toBe(100);
    });

    it('rechaza código duplicado con 409', async () => {
      await request(app).post('/api/equipment').send({
        code: 'DUP-001',
        name: 'Original',
        type: 'CAMION',
        currentHourmeter: 0,
        lastMaintenanceHourmeter: 0,
        maintenanceInterval: 250,
      });

      const res = await request(app).post('/api/equipment').send({
        code: 'DUP-001',
        name: 'Duplicado',
        type: 'CAMION',
        currentHourmeter: 0,
        lastMaintenanceHourmeter: 0,
        maintenanceInterval: 250,
      });

      expect(res.status).toBe(409);
      expect(res.body.error).toContain('código');
    });

    it('rechaza horómetro negativo con 400', async () => {
      const res = await request(app).post('/api/equipment').send({
        code: 'NEG-001',
        name: 'Test',
        type: 'CAMION',
        currentHourmeter: -50,
        lastMaintenanceHourmeter: 0,
        maintenanceInterval: 250,
      });

      expect(res.status).toBe(400);
    });

    it('rechaza currentHourmeter menor que lastMaintenanceHourmeter', async () => {
      const res = await request(app).post('/api/equipment').send({
        code: 'INV-001',
        name: 'Test',
        type: 'CAMION',
        currentHourmeter: 50,
        lastMaintenanceHourmeter: 100,
        maintenanceInterval: 250,
      });

      expect(res.status).toBe(400);
    });
  });

  describe('Cálculo de estado', () => {
    it('calcula REQUIERE_MANTENIMIENTO cuando alcanza el intervalo', async () => {
      const res = await request(app).post('/api/equipment').send({
        code: 'CAM-001',
        name: 'Camión',
        type: 'CAMION',
        currentHourmeter: 1250,
        lastMaintenanceHourmeter: 1000,
        maintenanceInterval: 250,
      });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('REQUIERE_MANTENIMIENTO');
      expect(res.body.data.hoursSinceLastMaintenance).toBe(250);
    });

    it('calcula OPERATIVO cuando no alcanza el intervalo', async () => {
      const res = await request(app).post('/api/equipment').send({
        code: 'EXC-001',
        name: 'Excavadora',
        type: 'EXCAVADORA',
        currentHourmeter: 800,
        lastMaintenanceHourmeter: 500,
        maintenanceInterval: 500,
      });

      expect(res.body.data.status).toBe('OPERATIVO');
      expect(res.body.data.hoursSinceLastMaintenance).toBe(300);
    });
  });

  describe('PUT /api/equipment/:id', () => {
    it('rechaza horómetro decreciente con 400', async () => {
      const created = await request(app).post('/api/equipment').send({
        code: 'UPD-001',
        name: 'Test',
        type: 'CAMION',
        currentHourmeter: 500,
        lastMaintenanceHourmeter: 0,
        maintenanceInterval: 250,
      });

      const res = await request(app)
        .put(`/api/equipment/${created.body.data.id}`)
        .send({ currentHourmeter: 400 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('disminuir');
    });
  });

  describe('DELETE /api/equipment/:id', () => {
    it('elimina un equipo existente', async () => {
      const created = await request(app).post('/api/equipment').send({
        code: 'DEL-001',
        name: 'Test',
        type: 'CAMION',
        currentHourmeter: 0,
        lastMaintenanceHourmeter: 0,
        maintenanceInterval: 250,
      });

      const res = await request(app).delete(`/api/equipment/${created.body.data.id}`);
      expect(res.status).toBe(204);
    });
  });
});