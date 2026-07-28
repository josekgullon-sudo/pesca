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

for _ in $(seq 1 "$ESPERA_MAXIMA"); do
  if comprobar; then
    paso "Desplegado y respondiendo"
    docker compose ps
    exit 0
  fi
  sleep 1
done

# Si se llega aquí, algo ha ido mal. Los registros son lo primero que hace
# falta para saber qué, así que se imprimen sin tener que entrar a buscarlos.
paso "LA APP NO RESPONDE tras ${ESPERA_MAXIMA}s"
docker compose ps || true
echo
echo "--- Últimas 80 líneas del registro de la app ---"
docker compose logs --tail 80 app || true
exit 1
