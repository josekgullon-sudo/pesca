-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Sitio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "municipio" TEXT NOT NULL,
    "provinciaId" TEXT NOT NULL,
    "latitud" REAL NOT NULL,
    "longitud" REAL NOT NULL,
    "descripcion" TEXT NOT NULL,
    "capacidadHm3" REAL,
    "accesoDescripcion" TEXT NOT NULL,
    "dificultadAcceso" TEXT NOT NULL,
    "tieneSombra" BOOLEAN NOT NULL DEFAULT false,
    "navegable" BOOLEAN NOT NULL DEFAULT false,
    "distanciaDesdeDosHermanasKm" REAL NOT NULL,
    "tiempoCocheMin" INTEGER NOT NULL,
    "esAreaDelimitadaEEI" BOOLEAN NOT NULL DEFAULT false,
    "eeiComprobado" BOOLEAN NOT NULL DEFAULT false,
    "notasLegales" TEXT NOT NULL DEFAULT '',
    "avisosSanitarios" TEXT NOT NULL DEFAULT '',
    "mejorEpoca" TEXT NOT NULL DEFAULT '[]',
    "urlNivelAgua" TEXT,
    "imagenUrl" TEXT,
    "imagenAutor" TEXT,
    "imagenLicencia" TEXT,
    "imagenFuente" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Sitio_provinciaId_fkey" FOREIGN KEY ("provinciaId") REFERENCES "Provincia" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Sitio" ("accesoDescripcion", "avisosSanitarios", "capacidadHm3", "createdAt", "descripcion", "dificultadAcceso", "distanciaDesdeDosHermanasKm", "esAreaDelimitadaEEI", "id", "imagenAutor", "imagenFuente", "imagenLicencia", "imagenUrl", "latitud", "longitud", "mejorEpoca", "municipio", "navegable", "nombre", "notasLegales", "provinciaId", "slug", "tiempoCocheMin", "tieneSombra", "tipo", "updatedAt", "urlNivelAgua") SELECT "accesoDescripcion", "avisosSanitarios", "capacidadHm3", "createdAt", "descripcion", "dificultadAcceso", "distanciaDesdeDosHermanasKm", "esAreaDelimitadaEEI", "id", "imagenAutor", "imagenFuente", "imagenLicencia", "imagenUrl", "latitud", "longitud", "mejorEpoca", "municipio", "navegable", "nombre", "notasLegales", "provinciaId", "slug", "tiempoCocheMin", "tieneSombra", "tipo", "updatedAt", "urlNivelAgua" FROM "Sitio";
DROP TABLE "Sitio";
ALTER TABLE "new_Sitio" RENAME TO "Sitio";
CREATE UNIQUE INDEX "Sitio_slug_key" ON "Sitio"("slug");
CREATE INDEX "Sitio_tipo_idx" ON "Sitio"("tipo");
CREATE INDEX "Sitio_municipio_idx" ON "Sitio"("municipio");
CREATE INDEX "Sitio_provinciaId_idx" ON "Sitio"("provinciaId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
