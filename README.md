# Pesca Sevilla

App privada (dos usuarios) para pescar en la provincia de Sevilla. Tiene dos
partes: una **guía** de sitios, especies y aparejos con la información legal de
cada especie, y un **diario** de capturas.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS v4
- Prisma 7 + SQLite (preparado para migrar a PostgreSQL)
- Imágenes en el sistema de ficheros local, en `public/uploads`

## Arrancar en local

```bash
npm install
cp .env.example .env      # ajusta DATABASE_URL y SEED_PASSWORD si quieres
npm run db:deploy         # crea prisma/dev.db y aplica migraciones
npm run db:seed           # carga sitios, especies, aparejos y usuarios
npm run dev
```

Usuarios que crea el seed:

| Email                | Contraseña                          |
| -------------------- | ----------------------------------- |
| `jose@pesca.local`   | la de `SEED_PASSWORD` (`pesca2026`) |
| `pareja@pesca.local` | la misma                            |

El seed **no pisa** usuarios que ya existan, así que se puede cambiar la
contraseña sin miedo a que la próxima ejecución la revierta.

## Scripts

| Script               | Qué hace                                       |
| -------------------- | ---------------------------------------------- |
| `npm run dev`        | Servidor de desarrollo                         |
| `npm run build`      | Build de producción                            |
| `npm run start`      | Servidor de producción                         |
| `npm run typecheck`  | `tsc --noEmit`                                 |
| `npm run lint`       | ESLint                                         |
| `npm run db:migrate` | Crea y aplica una migración nueva (desarrollo) |
| `npm run db:deploy`  | Aplica migraciones existentes (producción)     |
| `npm run db:seed`    | Ejecuta el seed (es idempotente)               |
| `npm run db:studio`  | Prisma Studio para curiosear la base de datos  |

## Base de datos

`prisma/schema.prisma` está escrito para poder saltar a PostgreSQL sin dolor:

- No hay `enum` de Prisma (SQLite no los soporta). Los campos enumerados son
  `String` y sus valores válidos viven en `src/lib/enums.ts`.
- No hay arrays escalares. `Sitio.mejorEpoca` guarda un JSON de meses.
- No hay tipos nativos ni funciones específicas de un motor.

Para migrar:

1. `provider = "postgresql"` en `prisma/schema.prisma`
2. `npm i @prisma/adapter-pg` y cambiar el adaptador en `src/lib/prisma.ts`
3. `DATABASE_URL` a la cadena de Postgres y regenerar migraciones

## Fiabilidad de los datos del seed

- **Estado legal de especies y áreas delimitadas para especies exóticas
  invasoras**: contrastado a julio de 2026. Aun así, la app avisa por todas
  partes de que hay que verificarlo en el Portal de Caza y Pesca de la Junta de
  Andalucía antes de cada salida.
- **Coordenadas**: aproximadas. Sitúan la lámina de agua o el centro del tramo,
  no el punto de aparcamiento.
- **Distancias y tiempos desde Dos Hermanas**: estimados en coche.
- **Abundancias, probabilidades de captura y efectividad de aparejos**:
  estimación de partida, no un censo oficial. Están para tener una referencia el
  primer día e irlas ajustando con lo que registremos en el diario.

## Aviso legal

La información legal de esta aplicación es orientativa y puede quedar
desactualizada. Consulta siempre la orden de vedas vigente en el Portal de Caza
y Pesca de la Junta de Andalucía antes de salir a pescar. Es obligatorio llevar
licencia de pesca continental en vigor y seguro de responsabilidad civil.
