# DURIN ENGINE

**Sistema de gestion y mantenimiento preventivo de equipos mineros.**

Durin Engine es una aplicacion web full stack que permite registrar equipos mineros, controlar sus horas de funcionamiento, calcular automaticamente cuando requieren mantenimiento y mantener un historial completo de intervenciones.

![Angular](https://img.shields.io/badge/Angular-22-red?logo=angular)
![Node.js](https://img.shields.io/badge/Node.js-22-green?logo=node.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Tabla de Contenidos

1. [Presentacion](#presentacion)
2. [Descripcion del Proyecto](#descripcion-del-proyecto)
3. [Caracteristicas](#caracteristicas)
4. [Tecnologias Utilizadas](#tecnologias-utilizadas)
5. [Arquitectura](#arquitectura)
6. [Modelo de Datos](#modelo-de-datos)
7. [Endpoints de la API](#endpoints-de-la-api)
8. [Requisitos Previos](#requisitos-previos)
9. [Instalacion Local](#instalacion-local)
10. [Variables de Entorno](#variables-de-entorno)
11. [Ejecucion de Migraciones](#ejecucion-de-migraciones)
12. [Ejecucion de Pruebas](#ejecucion-de-pruebas)
13. [Construccion de Produccion](#construccion-de-produccion)
14. [Despliegue Automatizado](#despliegue-automatizado)
15. [URLs Publicas](#urls-publicas)
16. [Herramientas de IA Utilizadas](#herramientas-de-ia-utilizadas)

---

## Presentacion

Durin Engine nace como solucion al reto tecnico Full Stack de 4 dias. El objetivo es demostrar competencia end-to-end en desarrollo web: desde el modelo relacional en PostgreSQL hasta el despliegue automatizado en infraestructura real.

**El diferenciador clave** es el script `deploy.ps1` que automatiza el despliegue completo de frontend y backend con un solo comando, incluyendo migraciones de base de datos y health checks reales.

---

## Descripcion del Proyecto

Durin Engine gestiona el mantenimiento preventivo de equipos mineros. Cada equipo tiene:

- **Horometro actual**: horas totales de funcionamiento.
- **Horometro del ultimo mantenimiento**: horas al momento de la ultima intervencion.
- **Intervalo de mantenimiento**: horas entre mantenimientos recomendadas.

Cuando `(horometro actual - horometro ultimo mantenimiento) >= intervalo`, el equipo pasa automaticamente a estado **REQUIERE_MANTENIMIENTO**. Al registrar un mantenimiento, el horometro de ultimo mantenimiento se actualiza atomicamente y el estado se recalcula.

---

## Caracteristicas

- CRUD completo de equipos con validaciones (Zod + backend).
- Calculo automatico del estado de mantenimiento en el backend.
- Registro de mantenimientos con **transaccion atomica** en base de datos.
- Historial completo con filtros y busqueda.
- Dashboard con estadisticas en tiempo real.
- Interfaz dark industrial responsive.
- Rate limiting (100 req / 15 min por IP).
- Helmet + CORS restringido al dominio del frontend.
- 16 tests de backend validando reglas de negocio.
- Despliegue automatizado con un solo comando.

---

## Tecnologias Utilizadas

### Frontend

| Tecnologia | Version | Uso |
|---|---|---|
| Angular | 22 | Framework SPA (standalone components) |
| TypeScript | 6.0 | Tipado estricto |
| Tailwind CSS | 4 | Utilidades de diseno |
| Angular Signals | 22 | Estado reactivo |
| Reactive Forms | 22 | Formularios del CRUD |

### Backend

| Tecnologia | Version | Uso |
|---|---|---|
| Node.js | 22 | Runtime |
| Express | 5 | Framework HTTP |
| TypeScript | 5.8 | Tipado estricto |
| Prisma | 7 | ORM + migraciones |
| Zod | 4 | Validacion de entrada |
| Vitest | 3 | Testing |
| Helmet | 8 | Headers de seguridad |
| express-rate-limit | 8 | Rate limiting |

### Infraestructura

| Componente | Tecnologia |
|---|---|
| Base de datos | PostgreSQL 16 (Neon) |
| Frontend hosting | Cloudflare Pages |
| Backend hosting | Render |
| CI/CD | PowerShell + APIs |

---

## Arquitectura

\`\`\`
+---------------+         +----------------------+
|   Navegador   |--HTTPS->|  Cloudflare Pages    |
+---------------+         |  (Angular SPA)       |
       |                  +----------------------+
       | HTTPS
       v
+---------------+         +----------------------+
|   Render      |--Prisma>|  PostgreSQL (Neon)   |
|  Express API  |         |                      |
+---------------+         +----------------------+
\`\`\`

**Decisiones arquitectonicas clave:**

1. **Frontend y backend separados**: permite escalar independientemente y desplegar sin downtime cruzado.
2. **Calculo de estado en el backend**: el frontend no puede ser la fuente de verdad para logica de negocio critica.
3. **Transacciones atomicas para mantenimientos**: garantiza integridad (o se guarda el mantenimiento Y se actualiza el equipo, o no se guarda nada).
4. **Prisma 7 con driver adapter**: la version 7 de Prisma requiere `@prisma/adapter-pg` explicito.
5. **Monorepo con carpetas independientes**: `frontend/` y `backend/` mantienen sus propios `package.json`.

---

## Modelo de Datos

\`\`\`mermaid
erDiagram
    Equipment ||--o{ Maintenance : has
    Equipment {
        string id PK
        string code UK
        string name
        enum type
        float currentHourmeter
        float lastMaintenanceHourmeter
        float maintenanceInterval
        datetime createdAt
        datetime updatedAt
    }
    Maintenance {
        string id PK
        string equipmentId FK
        enum maintenanceType
        string description
        float hourmeter
        datetime maintenanceDate
        string observations
        datetime createdAt
    }
    MaintenanceTypeConfig {
        string id PK
        enum type UK
        float interval
    }
\`\`\`

**Constraints:**

- `Equipment.code` es UNIQUE.
- Indices en `Equipment.type`, `Equipment.currentHourmeter`, `Maintenance.equipmentId`, `Maintenance.maintenanceDate`.
- `Maintenance.equipmentId` tiene `ON DELETE CASCADE`.

---

## Endpoints de la API

### Health Check

\`\`\`
GET /health
\`\`\`

Devuelve estado del backend + conexion a PostgreSQL.

### Equipos

\`\`\`
GET    /api/equipment                 Lista con filtros
GET    /api/equipment/:id             Detalle
POST   /api/equipment                 Crear
PUT    /api/equipment/:id             Actualizar
DELETE /api/equipment/:id             Eliminar
\`\`\`

### Mantenimientos

\`\`\`
GET  /api/maintenance                 Lista todos
GET  /api/maintenance/:id             Detalle
POST /api/maintenance                 Registrar (transaccion atomica)
GET  /api/equipment/:id/maintenance   Historial por equipo
\`\`\`

### Dashboard

\`\`\`
GET /api/dashboard/summary
GET /api/dashboard/maintenance-status
\`\`\`

**Codigos HTTP:** 200 OK, 201 Creado, 204 Eliminado, 400 Datos invalidos, 404 No encontrado, 409 Conflicto, 429 Rate limit, 500 Error interno, 503 DB no disponible.

---

## Requisitos Previos

- **Node.js** >= 22
- **npm** >= 11
- **Docker Desktop** (para PostgreSQL local)
- **Git**
- **PowerShell 7+**

---

## Instalacion Local

\`\`\`powershell
# 1. Clonar
git clone https://github.com/tu-usuario/durin-engine.git
cd durin-engine

# 2. Base de datos
docker compose up -d

# 3. Backend
cd backend
Copy-Item ../.env.example .env
npm install
npx prisma migrate dev
npx prisma generate
npm run dev

# 4. Frontend (otra terminal)
cd frontend
npm install
npx ng serve --open
\`\`\`

---

## Variables de Entorno

### backend/.env

\`\`\`
DATABASE_URL="postgresql://durin_user:durin_password@localhost:5433/durin_engine?schema=public"
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:4200
\`\`\`

### frontend/src/environments/environment.ts

\`\`\`typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
};
\`\`\`

### frontend/src/environments/environment.prod.ts

\`\`\`typescript
export const environment = {
  production: true,
  apiUrl: 'https://durin-engine-api.onrender.com/api',
};
\`\`\`

> El .env real nunca se commitea. Solo se commitea .env.example.

---

## Ejecucion de Migraciones

\`\`\`powershell
cd backend
npx prisma migrate dev      # Desarrollo
npx prisma migrate deploy   # Produccion
npx prisma migrate status   # Ver estado
npx prisma studio           # Interfaz visual
\`\`\`

**Importante:** nunca usar `prisma migrate reset` en produccion.

---

## Ejecucion de Pruebas

\`\`\`powershell
cd backend
npm test            # Ejecuta todos los tests una vez
npm run test:watch  # Modo watch
\`\`\`

**Cobertura:** 16 tests.
- Equipos: creacion, duplicados, horometro negativo/decreciente, calculo de estado, eliminacion.
- Mantenimientos: transaccion atomica, actualizacion de ciclo, conservacion de historial, validaciones.
- Health: endpoint responde 200 + database connected.

---

## Construccion de Produccion

\`\`\`powershell
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npx ng build --configuration=production
\`\`\`

---

## Despliegue Automatizado

**Un solo comando publica todo:**

\`\`\`powershell
.\scripts\deploy.ps1
\`\`\`

El script ejecuta 7 pasos:

1. **Validaciones**: Node, npm, Angular, Wrangler, Git, variables de entorno.
2. **Build**: instala dependencias, ejecuta tests, compila backend y frontend.
3. **Migraciones**: `prisma migrate deploy` en produccion (nunca reset).
4. **Deploy backend**: sube a Render via API deploy hook.
5. **Deploy frontend**: `wrangler pages deploy` a Cloudflare.
6. **Health checks**: `GET /health` y `GET /` del frontend.
7. **Resumen**: tabla con [OK] / [FAIL] por paso.

**Si algo falla, el script retorna codigo de salida != 0** y no continua con los pasos siguientes. Es idempotente.

---

## URLs Publicas

| Servicio | URL |
|---|---|
| Frontend (Cloudflare Pages) | https://durin-engine.pages.dev |
| Backend API (Render) | https://durin-engine-api.onrender.com |
| Health Check | https://durin-engine-api.onrender.com/health |
| Repositorio GitHub | https://github.com/hernanrios5353/durin-engine |

---

## Herramientas de IA Utilizadas

- **Claude (Anthropic)**: asistencia en diseno de arquitectura, generacion de codigo base, redaccion de tests y debugging.
- **GitHub Copilot**: autocompletado en el editor.

Todo el codigo generado fue revisado, probado y ajustado manualmente. El uso de IA acelero el desarrollo pero no reemplazo el criterio tecnico.

---

## Licencia

MIT (c) Durin Engine
