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

Hace falta Node 20 o superior.

```bash
git clone <repo> && cd pesca
npm install
npm run setup    # crea .env con un AUTH_SECRET nuevo, migra y carga los datos
npm run dev      # http://localhost:3000
```

`npm run setup` es idempotente y no pisa un `.env` que ya exista.

### Actualizar a la última versión

```bash
git pull
npm ci        # NO npm install
npm run dev
```

Usa **`npm ci`** y no `npm install` para actualizar. `npm install` reescribe
`package-lock.json` si tu versión de npm no es exactamente la misma con la que
se generó, y entonces el siguiente `git pull` se planta con
«Your local changes to the following files would be overwritten by merge».
`npm ci` instala justo lo que dice el lockfile y no lo toca.

Si ya te ha pasado, el lockfile se regenera solo, así que se puede descartar sin
perder nada:

```bash
git restore package-lock.json
git pull
```

### Probarlo en el móvil

Como la app es mobile-first, lo suyo es abrirla en el teléfono. Con el móvil en
la misma wifi que el ordenador:

```bash
npm run dev:movil
```

y entra desde el móvil a `http://LA-IP-DEL-ORDENADOR:3000` (la ves con
`ipconfig getifaddr en0` en Mac o `hostname -I` en Linux).

Ojo: sin HTTPS el navegador no dará acceso a la cámara ni al GPS, que hacen
falta a partir del bloque 5. Para eso ya toca desplegar en el VPS con
certificado, o usar un túnel tipo `ngrok`.

Usuarios que crea el seed:

| Email                | Contraseña                          |
| -------------------- | ----------------------------------- |
| `jose@pesca.local`   | la de `SEED_PASSWORD` (`pesca2026`) |
| `pareja@pesca.local` | la misma                            |

El seed **no pisa** usuarios que ya existan, así que se puede cambiar la
contraseña sin miedo a que la próxima ejecución la revierta.

## Acceso

NextAuth con proveedor de credenciales y sesión en JWT. **No hay registro
público**: los dos usuarios los crea el seed y no hay forma de dar de alta a
nadie más desde la app.

- El middleware (`src/middleware.ts`) deja fuera de la sesión únicamente
  `/entrar` y los assets de la PWA. Todo lo demás pide login, **incluidas las
  fotos de `/uploads`**: así una foto de una captura no es accesible por el
  simple hecho de conocer su URL.
- La sesión dura 90 días. La app se usa a la orilla del agua y sin cobertura;
  que pidiera la contraseña justo cuando pica algo sería absurdo.
- `src/lib/auth.config.ts` va separado de `src/lib/auth.ts` a propósito: el
  middleware corre en runtime Edge y ahí no arranca Prisma, que usa un módulo
  nativo. El middleware solo lee el JWT de la cookie, sin tocar la base de datos.

Antes de desplegar, genera un `AUTH_SECRET` propio:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

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

## Qué hay construido

| Sección                                       | Estado         |
| --------------------------------------------- | -------------- |
| Base de datos, schema y datos semilla          | Hecho          |
| Acceso de los dos usuarios                     | Hecho          |
| Guía de sitios: listado, filtros, mapa y ficha | Hecho          |
| Guía de especies con semáforo legal            | Pendiente      |
| Registro de capturas con foto y GPS            | Pendiente      |
| Galería, estadísticas, ranking y comparativa   | Pendiente      |
| Recomendador "¿qué me llevo?"                  | Pendiente      |
| PWA y funcionamiento offline                   | Pendiente      |
| Registro de salidas                            | Pendiente      |

El mapa usa Leaflet con teselas de OpenStreetMap, sin API key. Necesita
conexión: cachear las teselas para uso offline es parte del bloque de PWA.

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
