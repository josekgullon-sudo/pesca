# Pesca Sevilla

Web de pesca de la provincia de Sevilla. Tiene tres partes: una **guía** de
sitios, especies y aparejos con la información legal de cada especie, un
**diario** de capturas y un **ranking**.

**Se lee entera sin cuenta.** Guía, mapa, capturas y ranking son públicos.
Crear una cuenta solo hace falta para registrar capturas, y el **registro está
abierto a cualquiera**.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS v4
- Prisma 7 + SQLite (preparado para migrar a PostgreSQL)
- Imágenes en el sistema de ficheros local, en `datos/` (ver más abajo)

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

NextAuth con proveedor de credenciales y sesión en JWT. El registro es abierto:
cualquiera puede crear una cuenta en `/registro`.

- **Leer es público.** Guía, mapa, especies, capturas y ranking se ven sin
  entrar, fotos incluidas. La lista de rutas que sí piden sesión está en
  `RUTAS_QUE_PIDEN_SESION`, en `src/lib/auth.config.ts`.
- **Escribir pide sesión.** Las acciones de servidor (guardar y borrar
  capturas) la comprueban por su cuenta con `usuarioActual()`, porque viajan
  como POST a páginas que sí son públicas y el middleware no las cubre. Cada
  uno solo puede borrar sus propias capturas.
- **Las coordenadas exactas de cada captura solo se ven con sesión.** El sitio
  (el embalse o el tramo de río) sale para todo el mundo, pero el punto al
  metro no: publicarlo es regalar los puestos y dejar un rastro de por dónde
  anda uno. Se cambia en `src/app/capturas/[id]/page.tsx` si se prefiere
  público.
- La sesión dura 90 días. La app se usa a la orilla del agua y sin cobertura;
  que pidiera la contraseña justo cuando pica algo sería absurdo.
- **El email nunca aparece en una URL** ni se muestra a nadie. Los filtros por
  persona van por id.
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
| Guía de especies con semáforo legal            | Hecho          |
| Registro de capturas con foto y GPS            | Hecho          |
| Ranking, galería y comparativa                 | Hecho          |
| Registro abierto, moderación y páginas legales | Hecho          |
| Recomendador "¿qué me llevo?"                  | Pendiente      |
| PWA y funcionamiento offline                   | Pendiente      |
| Registro de salidas                            | Pendiente      |

El mapa usa Leaflet con teselas de OpenStreetMap, sin API key. Necesita
conexión: cachear las teselas para uso offline es parte del bloque de PWA.

### Móvil y escritorio

El diseño es mobile-first, pero no se queda en una tira estrecha en el
ordenador. A partir de 768 px la navegación pasa de la barra inferior a la
cabecera, los filtros dejan de ser un desplegable y se quedan fijos en una
columna lateral, y los listados y las fichas se reparten en varias columnas.
Los párrafos largos se limitan a `max-w-prose` para que no crucen la pantalla
entera y sigan siendo legibles.

Las especies no tienen foto todavía. En vez de tirar de imágenes de internet,
que además tienen dueño, se dibuja una silueta con el color del semáforo legal,
así el listado se lee de un vistazo. Cuando haya fotos propias, basta con
rellenar `Especie.imagenUrl`.

## Registro abierto: qué implica

Con cualquiera pudiendo crear cuenta y subir fotos al disco del servidor, hay
piezas que no son opcionales:

- **Moderación.** `Usuario.rol` puede ser `usuario` o `admin`. Un admin puede
  borrar cualquier captura; el resto, solo las suyas. El seed deja las dos
  cuentas iniciales como admin. Para hacer admin a alguien más:
  `npx prisma studio` y cambiar su `rol`.
- **Límites de uso** (`src/lib/limites.ts`): 3 cuentas por IP y hora, 10
  intentos de login por IP cada cuarto de hora y 40 capturas por usuario y hora.
  Es una ventana deslizante en memoria, que vale para un único proceso de Node;
  con varios procesos habría que moverla a la base de datos o a Redis.
- **Borrado de cuenta** desde `/cuenta`: se lleva la cuenta, las capturas y las
  fotos del disco. Lo exige el derecho de supresión del RGPD.
- **Normas de uso** en `/normas` y **aviso legal y privacidad** en
  `/aviso-legal`.

### Pendiente antes de abrirla al público

1. **Rellenar los datos del responsable** en `src/app/aviso-legal/page.tsx`.
   Están marcados con `[COMPLETAR]` y la página avisa mientras falten. Una web
   pública que recoge emails, fotos y ubicaciones está sujeta al RGPD y a la
   LSSI, y conviene que alguien que sepa revise el texto.
2. **No hay verificación por email.** Cualquiera puede registrarse con un email
   que no es suyo, y no hay forma de recuperar la contraseña si se olvida.
   Ambas cosas necesitan un servidor de correo (SMTP o similar).
3. **La moderación es manual y a posteriori.** No hay cola de revisión ni forma
   de que un visitante denuncie una captura.

## Fotos

### Registro abierto: qué implica

Con cualquiera pudiendo crear cuenta y subir fotos al disco del servidor, hay
piezas que no son opcionales:

- **Moderación.** `Usuario.rol` puede ser `usuario` o `admin`. Un admin puede
  borrar cualquier captura; el resto, solo las suyas. El seed deja las dos
  cuentas iniciales como admin. Para hacer admin a alguien más:
  `npx prisma studio` y cambiar su `rol`.
- **Límites de uso** (`src/lib/limites.ts`): 3 cuentas por IP y hora, 10
  intentos de login por IP cada cuarto de hora y 40 capturas por usuario y hora.
  Es una ventana deslizante en memoria, que vale para un único proceso de Node;
  con varios procesos habría que moverla a la base de datos o a Redis.
- **Borrado de cuenta** desde `/cuenta`: se lleva la cuenta, las capturas y las
  fotos del disco. Lo exige el derecho de supresión del RGPD.
- **Normas de uso** en `/normas` y **aviso legal y privacidad** en
  `/aviso-legal`.

### Pendiente antes de abrirla al público

1. **Rellenar los datos del responsable** en `src/app/aviso-legal/page.tsx`.
   Están marcados con `[COMPLETAR]` y la página avisa mientras falten. Una web
   pública que recoge emails, fotos y ubicaciones está sujeta al RGPD y a la
   LSSI, y conviene que alguien que sepa revise el texto.
2. **No hay verificación por email.** Cualquiera puede registrarse con un email
   que no es suyo, y no hay forma de recuperar la contraseña si se olvida.
   Ambas cosas necesitan un servidor de correo (SMTP o similar).
3. **La moderación es manual y a posteriori.** No hay cola de revisión ni forma
   de que un visitante denuncie una captura.

## Fotos de las especies

```bash
npm run fotos              # solo las que no tienen foto
npm run fotos -- --todas   # rehacerlas todas
```

Descarga una foto por especie desde Wikimedia Commons y guarda **autor,
licencia y enlace al original**, que la ficha muestra al pie de la imagen. Casi
todas las fotos de Commons son Creative Commons con obligación de atribuir, así
que la atribución viaja con la foto en lugar de perderse. Las que fallen se
quedan con la silueta de color, que sigue funcionando.

Necesita conexión a internet, así que hay que ejecutarlo en tu máquina o en el
VPS, no vale con hacerlo en el repositorio.

### Dónde viven las imágenes

Las fotos **no** están en `public/`, y es a propósito. Next.js recorre `public/`
al compilar y solo sirve los ficheros que existían entonces: una foto subida en
producción daba 404 hasta el siguiente `npm run build`. Se guardan en `datos/` y
las sirve `src/app/media/[...ruta]/route.ts`, que las lee del disco en cada
petición y valida la ruta para que no se pueda salir de ahí.

De paso queda mejor para el VPS:

- `datos/` es **lo único que hay que copiar o montar como volumen**, junto con
  `prisma/dev.db`. Es lo que no se puede regenerar.
- Se cachean para siempre (`immutable`): el nombre del fichero es aleatorio y
  nunca se reescribe.

Las fotos que llegan del móvil se redimensionan a 1600 px de ancho y se pasan a
WebP con `sharp`, aplicando antes la orientación EXIF para que las verticales no
salgan tumbadas. Un JPEG de 4 MB se queda en unos 200 KB.

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
- **Coordenadas de los sitios**: aproximadas. Sitúan la lámina de agua o el centro del tramo,
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
