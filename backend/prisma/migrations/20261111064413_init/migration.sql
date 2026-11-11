-- CreateEnum
CREATE TYPE "EquipmentType" AS ENUM ('CAMION', 'EXCAVADORA', 'PERFORADORA');

-- CreateEnum
CREATE TYPE "MaintenanceType" AS ENUM ('PREVENTIVO', 'CORRECTIVO', 'PREDICTIVO');

-- CreateTable
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "EquipmentType" NOT NULL,
    "currentHourmeter" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastMaintenanceHourmeter" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maintenanceInterval" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Maintenance" (
    "id" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "maintenanceType" "MaintenanceType" NOT NULL,
    "description" TEXT NOT NULL,
    "hourmeter" DOUBLE PRECISION NOT NULL,
    "maintenanceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Maintenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceTypeConfig" (
    "id" TEXT NOT NULL,
    "type" "EquipmentType" NOT NULL,
    "interval" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceTypeConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Equipment_code_key" ON "Equipment"("code");

-- CreateIndex
CREATE INDEX "Equipment_code_idx" ON "Equipment"("code");

-- CreateIndex
CREATE INDEX "Equipment_type_idx" ON "Equipment"("type");

-- CreateIndex
CREATE INDEX "Maintenance_equipmentId_idx" ON "Maintenance"("equipmentId");

-- CreateIndex
CREATE INDEX "Maintenance_maintenanceDate_idx" ON "Maintenance"("maintenanceDate");

-- CreateIndex
CREATE UNIQUE INDEX "MaintenanceTypeConfig_type_key" ON "MaintenanceTypeConfig"("type");

-- AddForeignKey
ALTER TABLE "Maintenance" ADD CONSTRAINT "Maintenance_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
