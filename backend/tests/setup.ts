import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });

export const testPrisma = new PrismaClient({ adapter });

export async function cleanDatabase() {
  await testPrisma.maintenance.deleteMany();
  await testPrisma.equipment.deleteMany();
  await testPrisma.maintenanceTypeConfig.deleteMany();
}