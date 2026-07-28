-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Captura" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "sitioId" TEXT NOT NULL,
    "especieId" TEXT NOT NULL,
    "salidaId" TEXT,
    "fecha" DATETIME NOT NULL,
    "hora" TEXT NOT NULL,
    "pesoGramos" INTEGER,
    "longitudCm" REAL,
    "aparejoId" TEXT,
    "tecnicaId" TEXT,
    "latitud" REAL,
    "longitud" REAL,
    "liberado" BOOLEAN NOT NULL DEFAULT true,
    "temperaturaC" REAL,
    "condicionesMeteo" TEXT,
    "nivelAgua" TEXT,
    "notas" TEXT NOT NULL DEFAULT '',
    "clienteUuid" TEXT,
    "esEjemplo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "syncedAt" DATETIME,
    CONSTRAINT "Captura_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Captura_sitioId_fkey" FOREIGN KEY ("sitioId") REFERENCES "Sitio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Captura_especieId_fkey" FOREIGN KEY ("especieId") REFERENCES "Especie" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Captura_salidaId_fkey" FOREIGN KEY ("salidaId") REFERENCES "Salida" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Captura_aparejoId_fkey" FOREIGN KEY ("aparejoId") REFERENCES "Aparejo" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Captura_tecnicaId_fkey" FOREIGN KEY ("tecnicaId") REFERENCES "Tecnica" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Captura" ("aparejoId", "clienteUuid", "condicionesMeteo", "createdAt", "especieId", "fecha", "hora", "id", "latitud", "liberado", "longitud", "longitudCm", "nivelAgua", "notas", "pesoGramos", "salidaId", "sitioId", "syncedAt", "tecnicaId", "temperaturaC", "updatedAt", "usuarioId") SELECT "aparejoId", "clienteUuid", "condicionesMeteo", "createdAt", "especieId", "fecha", "hora", "id", "latitud", "liberado", "longitud", "longitudCm", "nivelAgua", "notas", "pesoGramos", "salidaId", "sitioId", "syncedAt", "tecnicaId", "temperaturaC", "updatedAt", "usuarioId" FROM "Captura";
DROP TABLE "Captura";
ALTER TABLE "new_Captura" RENAME TO "Captura";
CREATE UNIQUE INDEX "Captura_clienteUuid_key" ON "Captura"("clienteUuid");
CREATE INDEX "Captura_usuarioId_fecha_idx" ON "Captura"("usuarioId", "fecha");
CREATE INDEX "Captura_especieId_idx" ON "Captura"("especieId");
CREATE INDEX "Captura_sitioId_idx" ON "Captura"("sitioId");
CREATE INDEX "Captura_salidaId_idx" ON "Captura"("salidaId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
