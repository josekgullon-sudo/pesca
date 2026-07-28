#!/usr/bin/env bash
# Despliegue en el servidor. Lo ejecuta GitHub Actions por SSH, pero vale
# igual a mano:
#
#   bash docker/desplegar.sh
#
# No se copia al servidor: Actions lo manda por la entrada estándar, así que el
# servidor ejecuta siempre la versión que hay en la rama y no una copia vieja
# que alguien dejó ahí hace meses.
set -euo pipefail

DIRECTORIO="${DIRECTORIO_PESCA:-$HOME/pesca}"
RAMA="${RAMA_PESCA:-claude/fishing-app-sevilla-mdhbzr}"
# Cuántos segundos se espera a que la app conteste antes de dar el despliegue
# por fallido. La primera vez migra y siembra, así que tarda más de lo normal.
ESPERA_MAXIMA="${ESPERA_MAXIMA:-120}"

paso() { printf '\n\033[1m→ %s\033[0m\n' "$1"; }

cd "$DIRECTORIO"

DOMINIO="$(grep -E '^DOMINIO=' .env 2>/dev/null | head -1 | cut -d= -f2- | tr -d '"'"'"' ' || true)"

paso "Comprobando la configuración"
if [ -z "$DOMINIO" ]; then
  echo "ERROR: falta DOMINIO en $DIRECTORIO/.env" >&2
  exit 1
fi
# Los marcadores de la documentación son dominios reales de otra gente. Si uno
# se cuela en el .env, Caddy se pasa media hora pidiendo certificados que Let's
# Encrypt no le va a dar nunca, y el error que escribe no dice de dónde sale.
case "$DOMINIO" in
  tu-dominio.es | www.tu-dominio.es | midominio.es | ejemplo.* | *.example.*)
    echo "ERROR: DOMINIO=$DOMINIO es el marcador de la documentación." >&2
    echo "       Ponlo con tu dominio de verdad en $DIRECTORIO/.env" >&2
    exit 1
    ;;
esac
case "$DOMINIO" in
  http://* | https://* | */* | www.*)
    echo "ERROR: DOMINIO=$DOMINIO no tiene el formato correcto." >&2
    echo "       Va el dominio a secas: sin https://, sin www y sin barra." >&2
    echo "       Del www se encarga el Caddyfile." >&2
    exit 1
    ;;
esac
echo "Dominio: $DOMINIO"

paso "Copia de seguridad antes de tocar nada"
# Si todavía no hay nada levantado (primer despliegue) esto no puede hacer
# copia, y no es motivo para abortar.
if docker compose ps --status running --quiet app | grep -q .; then
  bash docker/copia-de-seguridad.sh
else
  echo "La app no está levantada todavía; no hay nada que copiar."
fi

paso "Actualizando el código"
git fetch origin "$RAMA"
# `reset --hard` y no `pull`: el servidor es un espejo de la rama, no un sitio
# donde se edita. Así un cambio suelto hecho a mano en el servidor no bloquea
# el despliegue con un conflicto. Solo afecta a ficheros versionados: el .env
# no lo está, y la base de datos y las fotos viven en un volumen de Docker.
git reset --hard "origin/$RAMA"
echo "Ahora en $(git rev-parse --short HEAD) — $(git log -1 --pretty=%s)"

paso "Reconstruyendo y levantando"
docker compose up -d --build

paso "Comprobando que responde"
# Se pregunta desde dentro del contenedor porque el puerto 3000 no está
# publicado al exterior: delante va Caddy. Node 22 ya trae fetch.
comprobar() {
  docker compose exec -T app node -e '
    fetch("http://127.0.0.1:3000/")
      .then((r) => process.exit(r.ok ? 0 : 1))
      .catch(() => process.exit(1));
  ' >/dev/null 2>&1
}

respondio=no
for _ in $(seq 1 "$ESPERA_MAXIMA"); do
  if comprobar; then
    respondio=si
    break
  fi
  sleep 1
done

if [ "$respondio" = "si" ]; then
  echo "La app contesta dentro del contenedor."

  # Que la app conteste por dentro no quiere decir que la web funcione: puede
  # faltar el certificado, o el DNS puede estar apuntando a otro sitio. Sin
  # esta segunda comprobación el despliegue se daba por bueno con la web caída.
  if [ "${COMPROBAR_HTTPS:-si}" = "si" ]; then
    paso "Comprobando https://$DOMINIO desde fuera"
    for intento in $(seq 1 30); do
      codigo=0
      curl -fsS --max-time 10 -o /dev/null "https://$DOMINIO/" 2>/dev/null || codigo=$?

      if [ "$codigo" = 0 ]; then
        paso "Desplegado y en línea en https://$DOMINIO"
        docker compose ps
        exit 0
      fi

      # 6 es «no se pudo resolver el nombre». Reintentar no sirve de nada: el
      # dominio no existe en el DNS y eso no se arregla desde aquí. Cortar en
      # seco y decirlo claro es mejor que dos minutos de errores iguales.
      if [ "$codigo" = 6 ]; then
        paso "EL DOMINIO $DOMINIO NO EXISTE EN EL DNS"
        echo "La app funciona; lo que falta es que el dominio apunte a este"
        echo "servidor. Eso se hace en el panel donde compraste el dominio,"
        echo "no aquí."
        echo
        echo "  1. Mira quién gestiona su DNS:   dig +short NS $DOMINIO"
        echo "  2. En el panel de ese proveedor, crea dos registros A:"
        echo "        @     ->  $(curl -s --max-time 5 ifconfig.me || echo 'la IP de este servidor')"
        echo "        www   ->  la misma IP"
        echo "     Borrando los que ya hubiera."
        echo "  3. Cuando 'dig +short $DOMINIO' devuelva esa IP, repite esto."
        exit 1
      fi

      [ "$intento" = 1 ] && echo "El dominio resuelve pero aún no contesta; el certificado tarda un poco la primera vez."
      sleep 5
    done

    paso "EL DOMINIO RESUELVE PERO https://$DOMINIO NO CONTESTA"
    echo "El nombre existe, así que casi siempre es una de estas dos:"
    echo "  1. Apunta a otro servidor. Compruébalo con:  dig +short $DOMINIO"
    echo "  2. Caddy no ha conseguido el certificado. Mira el registro de abajo."
    echo
    echo "--- Últimas 30 líneas del registro de Caddy ---"
    docker compose logs --tail 30 caddy || true
    exit 1
  fi

  paso "Desplegado y respondiendo"
  docker compose ps
  exit 0
fi

# Si se llega aquí, algo ha ido mal. Los registros son lo primero que hace
# falta para saber qué, así que se imprimen sin tener que entrar a buscarlos.
paso "LA APP NO RESPONDE tras ${ESPERA_MAXIMA}s"
docker compose ps || true
echo
echo "--- Últimas 80 líneas del registro de la app ---"
docker compose logs --tail 80 app || true
exit 1
