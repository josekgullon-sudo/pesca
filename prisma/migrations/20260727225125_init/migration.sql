-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Sitio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "municipio" TEXT NOT NULL,
    "provincia" TEXT NOT NULL DEFAULT 'Sevilla',
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
    "notasLegales" TEXT NOT NULL DEFAULT '',
    "avisosSanitarios" TEXT NOT NULL DEFAULT '',
    "mejorEpoca" TEXT NOT NULL DEFAULT '[]',
    "urlNivelAgua" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Especie" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "nombreComun" TEXT NOT NULL,
    "nombreCientifico" TEXT NOT NULL,
    "esAutoctona" BOOLEAN NOT NULL DEFAULT false,
    "estadoLegal" TEXT NOT NULL,
    "tallaMinimaCm" INTEGER,
    "comestible" TEXT NOT NULL,
    "notasComestibilidad" TEXT NOT NULL DEFAULT '',
    "notasLegales" TEXT NOT NULL DEFAULT '',
    "imagenUrl" TEXT,
    "descripcion" TEXT NOT NULL,
    "comoPescarla" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SitioEspecie" (
    "sitioId" TEXT NOT NULL,
    "especieId" TEXT NOT NULL,
    "abundancia" INTEGER NOT NULL,
    "probabilidadCaptura" TEXT NOT NULL,
    "notas" TEXT NOT NULL DEFAULT '',
    "mejorTecnica" TEXT NOT NULL DEFAULT '',

    PRIMARY KEY ("sitioId", "especieId"),
    CONSTRAINT "SitioEspecie_sitioId_fkey" FOREIGN KEY ("sitioId") REFERENCES "Sitio" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SitioEspecie_especieId_fkey" FOREIGN KEY ("especieId") REFERENCES "Especie" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tecnica" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Aparejo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "precioAproxEur" REAL,
    "imagenUrl" TEXT
);

-- CreateTable
CREATE TABLE "AparejoEspecie" (
    "aparejoId" TEXT NOT NULL,
    "especieId" TEXT NOT NULL,
    "efectividad" INTEGER NOT NULL,
    "notas" TEXT NOT NULL DEFAULT '',

    PRIMARY KEY ("aparejoId", "especieId"),
    CONSTRAINT "AparejoEspecie_aparejoId_fkey" FOREIGN KEY ("aparejoId") REFERENCES "Aparejo" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AparejoEspecie_especieId_fkey" FOREIGN KEY ("especieId") REFERENCES "Especie" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AparejoSitio" (
    "aparejoId" TEXT NOT NULL,
    "sitioId" TEXT NOT NULL,
    "recomendado" BOOLEAN NOT NULL DEFAULT true,
    "notas" TEXT NOT NULL DEFAULT '',

    PRIMARY KEY ("aparejoId", "sitioId"),
    CONSTRAINT "AparejoSitio_aparejoId_fkey" FOREIGN KEY ("aparejoId") REFERENCES "Aparejo" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AparejoSitio_sitioId_fkey" FOREIGN KEY ("sitioId") REFERENCES "Sitio" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Salida" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "sitioId" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL,
    "horaInicio" TEXT,
    "horaFin" TEXT,
    "notas" TEXT NOT NULL DEFAULT '',
    "valoracion" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Salida_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Salida_sitioId_fkey" FOREIGN KEY ("sitioId") REFERENCES "Sitio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Captura" (
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

-- CreateTable
CREATE TABLE "FotoCaptura" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "capturaId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "esPrincipal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FotoCaptura_capturaId_fkey" FOREIGN KEY ("capturaId") REFERENCES "Captura" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Sitio_slug_key" ON "Sitio"("slug");

-- CreateIndex
CREATE INDEX "Sitio_tipo_idx" ON "Sitio"("tipo");

-- CreateIndex
CREATE INDEX "Sitio_municipio_idx" ON "Sitio"("municipio");

-- CreateIndex
CREATE UNIQUE INDEX "Especie_slug_key" ON "Especie"("slug");

-- CreateIndex
CREATE INDEX "Especie_estadoLegal_idx" ON "Especie"("estadoLegal");

-- CreateIndex
CREATE INDEX "SitioEspecie_especieId_idx" ON "SitioEspecie"("especieId");

-- CreateIndex
CREATE UNIQUE INDEX "Tecnica_slug_key" ON "Tecnica"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Aparejo_slug_key" ON "Aparejo"("slug");

-- CreateIndex
CREATE INDEX "Aparejo_tipo_idx" ON "Aparejo"("tipo");

-- CreateIndex
CREATE INDEX "AparejoEspecie_especieId_idx" ON "AparejoEspecie"("especieId");

-- CreateIndex
CREATE INDEX "AparejoSitio_sitioId_idx" ON "AparejoSitio"("sitioId");

-- CreateIndex
CREATE INDEX "Salida_usuarioId_fecha_idx" ON "Salida"("usuarioId", "fecha");

-- CreateIndex
CREATE INDEX "Salida_sitioId_idx" ON "Salida"("sitioId");

-- CreateIndex
CREATE UNIQUE INDEX "Captura_clienteUuid_key" ON "Captura"("clienteUuid");

-- CreateIndex
CREATE INDEX "Captura_usuarioId_fecha_idx" ON "Captura"("usuarioId", "fecha");

-- CreateIndex
CREATE INDEX "Captura_especieId_idx" ON "Captura"("especieId");

-- CreateIndex
CREATE INDEX "Captura_sitioId_idx" ON "Captura"("sitioId");

-- CreateIndex
CREATE INDEX "Captura_salidaId_idx" ON "Captura"("salidaId");

-- CreateIndex
CREATE INDEX "FotoCaptura_capturaId_idx" ON "FotoCaptura"("capturaId");
