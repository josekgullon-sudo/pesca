-- CreateTable
CREATE TABLE "Articulo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "entradilla" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "publicada" BOOLEAN NOT NULL DEFAULT false,
    "publicadaEl" DATETIME,
    "provinciaId" TEXT,
    "imagenUrl" TEXT,
    "imagenAutor" TEXT,
    "imagenLicencia" TEXT,
    "imagenFuente" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Articulo_provinciaId_fkey" FOREIGN KEY ("provinciaId") REFERENCES "Provincia" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Articulo_slug_key" ON "Articulo"("slug");

-- CreateIndex
CREATE INDEX "Articulo_publicada_publicadaEl_idx" ON "Articulo"("publicada", "publicadaEl");
