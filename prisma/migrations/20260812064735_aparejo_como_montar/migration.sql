-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Aparejo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "precioAproxEur" REAL,
    "imagenUrl" TEXT,
    "imagenAutor" TEXT,
    "imagenLicencia" TEXT,
    "imagenFuente" TEXT,
    "comoMontar" TEXT NOT NULL DEFAULT ''
);
INSERT INTO "new_Aparejo" ("descripcion", "id", "imagenUrl", "nombre", "precioAproxEur", "slug", "tipo") SELECT "descripcion", "id", "imagenUrl", "nombre", "precioAproxEur", "slug", "tipo" FROM "Aparejo";
DROP TABLE "Aparejo";
ALTER TABLE "new_Aparejo" RENAME TO "Aparejo";
CREATE UNIQUE INDEX "Aparejo_slug_key" ON "Aparejo"("slug");
CREATE INDEX "Aparejo_tipo_idx" ON "Aparejo"("tipo");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
