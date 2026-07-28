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
#
#    CAMBIA EL DOMINIO POR EL TUYO antes de ejecutar esto. Va a secas: sin
#    https://, sin www y sin barra final. Si se cuela un dominio de ejemplo,
#    Caddy se pasa media hora pidiendo un certificado que no le van a dar.
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

Son dos cosas distintas y hacen falta las dos:

1. **Que el dominio apunte al servidor**, en el panel de tu proveedor de
   dominios. Esto no se hace en el servidor.
2. **Que `DOMINIO` en el `.env` sea ese mismo dominio.** Es lo que le dice a
   Caddy qué certificado pedir.

Si solo haces la segunda, Let's Encrypt llamará al dominio, contestará otro
servidor y no habrá certificado.

En el panel del dominio, dos registros `A`:

| Tipo | Nombre | Valor                   | TTL |
| ---- | ------ | ----------------------- | --- |
| A    | `@`    | la IP de tu servidor    | 300 |
| A    | `www`  | la IP de tu servidor    | 300 |

**Borra los que ya hubiera** para `@` y `www`. Un dominio recién comprado suele
traer un `A` a la página de «en construcción» del registrador y un `CNAME` en
`www`; si se queda ahí, unas veces cargará tu web y otras la del registrador.

El nombre es `@`, no el dominio entero: cada panel lo escribe a su manera, así
que mira cómo están puestos los registros que ya hay y copia ese estilo.

Tarda entre unos minutos y unas horas. Antes de levantar nada, comprueba que
ha resuelto:

```bash
dig +short mapadepesca.es
dig +short www.mapadepesca.es
```

Las dos tienen que devolver la IP de tu servidor. Cuando resuelvan, Caddy pide
el certificado solo la primera vez que alguien entre.

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
bash docker/desplegar.sh
```

Hace copia de seguridad, actualiza el código, reconstruye, levanta y **espera a
comprobar que la web contesta**. Si no contesta, saca los registros y termina
con error, en vez de dejarte creyendo que ha ido bien.

Las migraciones se aplican solas al arrancar y el seed es idempotente, así que
no pisa contraseñas ni fotos.

## Despliegue automático

Con esto configurado no hay que volver a entrar por SSH: cada cambio que se
suba a la rama se despliega solo. Lo hace `.github/workflows/desplegar.yml`,
que primero comprueba el proyecto (tipos, lint y build) y solo despliega si
todo pasa.

Mientras falten los secretos, el workflow no hace nada y **no da error**.

### 1. En el servidor: un usuario sin privilegios de root

Dar a GitHub una llave del servidor es cómodo, pero significa que quien entre
en tu cuenta de GitHub entra en tu servidor. Así que la llave no es de root:

```bash
adduser --disabled-password --gecos "" despliegue
usermod -aG docker despliegue
```

Estar en el grupo `docker` ya es mucho poder —permite arrancar contenedores
privilegiados—, pero es lo mínimo que necesita para desplegar, y sigue siendo
mejor que entregar root.

Ahora se mueve el proyecto a su carpeta y se le da la propiedad:

```bash
mv /root/pesca /home/despliegue/pesca
chown -R despliegue:despliegue /home/despliegue/pesca
```

### 2. En el servidor: la llave

```bash
sudo -u despliegue ssh-keygen -t ed25519 -N "" -C "despliegue-github" \
  -f /home/despliegue/.ssh/github
sudo -u despliegue sh -c 'cat /home/despliegue/.ssh/github.pub >> /home/despliegue/.ssh/authorized_keys'
chmod 600 /home/despliegue/.ssh/authorized_keys
```

Y se sacan los tres valores que hay que copiar. **Esto es lo único que se pega
en GitHub, y se pega en Secrets, en ningún otro sitio:**

```bash
echo "--- SSH_CLAVE_PRIVADA ---"; cat /home/despliegue/.ssh/github
echo "--- SSH_HOST_KEY ---";      ssh-keyscan -t ed25519 localhost 2>/dev/null | sed "s/^localhost/$(curl -s ifconfig.me)/"
```

### 3. En GitHub: los secretos

En el repositorio → **Settings → Secrets and variables → Actions → New
repository secret**. Cuatro secretos:

| Nombre              | Valor                                                       |
| ------------------- | ----------------------------------------------------------- |
| `SSH_CLAVE_PRIVADA` | Todo el bloque `-----BEGIN...END OPENSSH PRIVATE KEY-----`   |
| `SSH_HOST_KEY`      | La línea que sale de `ssh-keyscan`, entera                   |
| `SSH_SERVIDOR`      | La IP del servidor                                           |
| `SSH_USUARIO`       | `despliegue`                                                 |

Y en la pestaña **Variables** de la misma página, una variable:

| Nombre            | Valor                    |
| ----------------- | ------------------------ |
| `DIRECTORIO_PESCA`| `/home/despliegue/pesca` |

`SSH_HOST_KEY` es la huella del servidor. Sirve para que el despliegue se
niegue a conectarse si quien contesta no es tu máquina; sin ella habría que
aceptar a ciegas a cualquiera que responda a esa IP.

### 4. Probarlo

En GitHub, pestaña **Actions** → «Comprobar y desplegar» → **Run workflow**.
Si algo falla, el registro del paso «Desplegar» trae ya las últimas ochenta
líneas del contenedor.

A partir de ahí, cada cambio subido a la rama se despliega solo, y GitHub
manda un correo si falla.

### Si hace falta volver atrás

El despliegue automático no revierte nada solo. Para volver a la versión
anterior, en el servidor:

```bash
cd /home/despliegue/pesca
git log --oneline -5          # elegir a cuál volver
git reset --hard <el-commit>
docker compose up -d --build
```

Las copias de la base de datos están en `/var/backups/pesca`.

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
