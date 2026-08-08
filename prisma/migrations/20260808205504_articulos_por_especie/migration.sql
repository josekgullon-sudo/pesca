-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Articulo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "entradilla" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "publicada" BOOLEAN NOT NULL DEFAULT false,
    "publicadaEl" DATETIME,
    "provinciaId" TEXT,
    "especieId" TEXT,
    "imagenUrl" TEXT,
    "imagenAutor" TEXT,
    "imagenLicencia" TEXT,
    "imagenFuente" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Articulo_provinciaId_fkey" FOREIGN KEY ("provinciaId") REFERENCES "Provincia" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Articulo_especieId_fkey" FOREIGN KEY ("especieId") REFERENCES "Especie" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Articulo" ("contenido", "createdAt", "entradilla", "id", "imagenAutor", "imagenFuente", "imagenLicencia", "imagenUrl", "provinciaId", "publicada", "publicadaEl", "slug", "titulo", "updatedAt") SELECT "contenido", "createdAt", "entradilla", "id", "imagenAutor", "imagenFuente", "imagenLicencia", "imagenUrl", "provinciaId", "publicada", "publicadaEl", "slug", "titulo", "updatedAt" FROM "Articulo";
DROP TABLE "Articulo";
ALTER TABLE "new_Articulo" RENAME TO "Articulo";
CREATE UNIQUE INDEX "Articulo_slug_key" ON "Articulo"("slug");
CREATE INDEX "Articulo_publicada_publicadaEl_idx" ON "Articulo"("publicada", "publicadaEl");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
