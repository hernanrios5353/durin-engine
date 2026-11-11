import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { testPrisma } from './setup.js';

describe('GET /health', () => {
  afterAll(async () => {
    await testPrisma.$disconnect();
  });

  it('devuelve status ok y database connected cuando la BD responde', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.database).toBe('connected');
    expect(res.body.timestamp).toBeDefined();
  });
});