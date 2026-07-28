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

## Paso a paso en un VPS recién comprado

Vale para Hostinger, Hetzner, DigitalOcean o cualquiera con Ubuntu o Debian.

```bash
# 1. Entrar
ssh root@LA-IP-DE-TU-SERVIDOR

# 2. Docker (el instalador oficial vale para Ubuntu y Debian)
curl -fsSL https://get.docker.com | sh

# 3. Swap, si el servidor tiene menos de 2 GB de RAM.
#    Sin esto, compilar Next.js se queda sin memoria y el proceso muere sin
#    decir por qué. Es el fallo más común al desplegar.
free -h
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# 4. Cortafuegos
ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw --force enable

# 5. El proyecto. Si el repositorio es privado, git pedirá tu usuario de GitHub
#    y un token personal (Settings → Developer settings → Personal access tokens).
git clone https://github.com/josekgullon-sudo/pesca.git
cd pesca
git checkout claude/fishing-app-sevilla-mdhbzr

# 6. Configuración. El AUTH_SECRET se genera solo; no lo copies de ningún sitio.
#    URL_BASE sale de DOMINIO, así que normalmente no hay que ponerla.
cat > .env <<EOF
DOMINIO=mapadepesca.es
AUTH_SECRET=$(openssl rand -base64 32)
SEED_PASSWORD=una-contraseña-larga-tuya
EOF

# 7. Levantar
docker compose up -d --build
```

La primera vez tarda varios minutos: compila la imagen entera.

Para ver los registros y comprobar que ha ido bien:

```bash
docker compose logs -f app
```

### Verlo antes de tener el dominio

Si el dominio todavía no apunta al servidor, Caddy no podrá sacar el
certificado. Para comprobar mientras tanto que todo arranca:

```bash
docker compose -f docker-compose.yml -f docker-compose.pruebas.yml up -d --build app
```

Y abre `http://LA-IP-DE-TU-SERVIDOR:3000`. **Es solo para probar**: sin HTTPS no
hay cámara ni GPS y la contraseña viaja en claro. En cuanto el dominio apunte,
`docker compose down` y arriba con el compose normal.

### El dominio

En el panel de tu proveedor de dominios, un registro `A`:

| Tipo | Nombre | Valor                   |
| ---- | ------ | ----------------------- |
| A    | `@`    | la IP de tu servidor    |
| A    | `www`  | la IP de tu servidor    |

Tarda entre unos minutos y unas horas. Cuando resuelva, Caddy pide el
certificado solo la primera vez que alguien entre.

Comprueba que ha resuelto antes de levantar el compose normal:

```bash
dig +short mapadepesca.es
```

Si no devuelve la IP de tu servidor, Caddy intentará sacar el certificado, Let's
Encrypt le dirá que no y se quedará reintentando.

### Después de que esté en línea

```bash
curl -s https://mapadepesca.es/robots.txt
curl -s https://mapadepesca.es/sitemap.xml | head
```

Las URLs que salgan ahí tienen que ser las de tu dominio. Si salen con
`mapadepesca.es` y tu dominio es otro, falta `URL_BASE` en el `.env` (por
defecto se construye con `https://$DOMINIO`).

Luego, en [Google Search Console](https://search.google.com/search-console),
añade la propiedad del dominio y manda el sitemap. Es lo que hace que Google
descubra las páginas en días en vez de en semanas.

## Lo recomendado: un VPS pequeño

Un servidor de 4-6 € al mes sobra de largo. Sirve cualquiera con Docker:
Hetzner, DigitalOcean, OVH, Contabo.

```bash
# En el servidor, una vez
git clone <repo> pesca && cd pesca

cat > .env <<EOF
DOMINIO=mapadepesca.es
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
