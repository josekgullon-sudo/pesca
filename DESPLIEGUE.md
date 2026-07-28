# Poner la web en internet

## Qué necesita esta app

Antes de elegir hosting conviene saber qué pide, porque descarta la mitad de las
opciones:

- **Disco que no se borre.** La base de datos es un fichero SQLite y las fotos
  son ficheros en disco, los dos en `datos/`. Un hosting con sistema de ficheros
  efímero (Vercel, Netlify, Cloudflare Pages) **no vale tal cual**: cada
  despliegue se llevaría por delante las capturas y las fotos.
- **Node de verdad**, no solo funciones. Usa dos módulos nativos: `sharp` para
  las fotos y `better-sqlite3` para la base de datos.
- **HTTPS.** Sin certificado el navegador no da acceso a la cámara ni al GPS, y
  eso es media app.
- **Que no se duerma.** Los planes gratuitos que apagan el servidor cuando no
  hay visitas arruinan el posicionamiento: Google encuentra la web caída.

## Lo recomendado: un VPS pequeño

Un servidor de 4-6 € al mes sobra de largo. Sirve cualquiera con Docker:
Hetzner, DigitalOcean, OVH, Contabo.

```bash
# En el servidor, una vez
git clone <repo> pesca && cd pesca

cat > .env <<EOF
DOMINIO=pescasevilla.es
AUTH_SECRET=$(openssl rand -base64 32)
SEED_PASSWORD=una-contraseña-larga-tuya
EOF

docker compose up -d --build
```

Con el dominio apuntando al servidor (un registro `A` a su IP), Caddy pide el
certificado solo. No hay más configuración.

Para actualizar:

```bash
git pull && docker compose up -d --build
```

Las migraciones se aplican solas al arrancar y el seed es idempotente, así que
no pisa contraseñas ni fotos.

### Copias de seguridad

Lo único que no se puede regenerar es `datos/`: la base de datos y las fotos.
Todo lo demás sale del repositorio.

```bash
crontab -e
# 0 4 * * * /home/TU-USUARIO/pesca/docker/copia-de-seguridad.sh >> /var/log/pesca-copias.log 2>&1
```

Guarda una copia diaria y borra las de más de treinta días. **Bájatelas a otro
sitio de vez en cuando**: una copia que vive en el mismo servidor no es una
copia de seguridad.

## Alternativa sin terminal: Railway, Render o Fly.io

Despliegan desde GitHub y dan HTTPS sin tocar nada. Funcionan **si les añades un
volumen persistente montado en `/app/datos`**; sin eso, cada despliegue borra las
capturas.

- **Railway**: unos 5 $/mes, volúmenes fáciles, no se duerme.
- **Fly.io**: parecido, con volumen propio.
- **Render**: su plan gratuito **apaga el servidor** cuando no hay tráfico, así
  que para posicionar hay que ir al de pago.

Detecta el `Dockerfile` solo. Variables a poner: `AUTH_SECRET`, `SEED_PASSWORD`
y `DATABASE_URL=file:/app/datos/pesca.db`.

## Si algún día hace falta más: PostgreSQL

El schema está escrito para poder migrar sin dolor (ver README). En cuanto haya
varias provincias con tráfico de verdad, o se quiera desplegar en más de un
proceso, tocaría:

1. `provider = "postgresql"` en `prisma/schema.prisma`
2. `npm i @prisma/adapter-pg` y cambiar el adaptador en `src/lib/prisma.ts`
3. Mover las fotos a almacenamiento de objetos (S3, Cloudflare R2) y cambiar
   `src/lib/imagenes.ts`
4. Mover los límites de uso de `src/lib/limites.ts` fuera de memoria

Con eso ya sí valdría Vercel, que es lo mejor para velocidad y posicionamiento.
Antes de tener tráfico no compensa el trabajo.

## Antes de abrirla al público

- [ ] Rellenar los datos del responsable en `src/app/aviso-legal/page.tsx`
- [ ] Cambiar la contraseña de las dos cuentas del seed
- [ ] `AUTH_SECRET` propio, generado en el servidor
- [ ] Comprobar que las copias de seguridad se están haciendo
- [ ] Banner de consentimiento de cookies **antes** de poner AdSense
