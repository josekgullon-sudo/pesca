#!/bin/sh
# Copia de seguridad de lo único que no se puede regenerar: la base de datos y
# las fotos. Todo lo demás sale del repositorio.
#
# Se pone en el cron del servidor, por ejemplo a las cuatro de la mañana:
#   0 4 * * * /ruta/al/repo/docker/copia-de-seguridad.sh >> /var/log/pesca-copias.log 2>&1
set -e

DESTINO="${DESTINO:-/var/backups/pesca}"
FECHA=$(date +%Y-%m-%d)
CONSERVAR_DIAS="${CONSERVAR_DIAS:-30}"

mkdir -p "$DESTINO"

# La base de datos se copia con el comando de SQLite, no con `cp`: copiar el
# fichero mientras hay escrituras puede dar una copia corrupta.
docker compose exec -T app sh -c \
  'npx --yes prisma db execute --stdin' <<'SQL' > /dev/null 2>&1 || true
SELECT 1;
SQL

docker compose exec -T app sh -c \
  "sqlite3 /app/datos/pesca.db \".backup '/app/datos/copia-tmp.db'\"" 2>/dev/null \
  || docker compose exec -T app sh -c "cp /app/datos/pesca.db /app/datos/copia-tmp.db"

docker compose cp app:/app/datos/copia-tmp.db "$DESTINO/pesca-$FECHA.db"
docker compose exec -T app rm -f /app/datos/copia-tmp.db

# Las fotos, en un tar aparte.
docker compose exec -T app tar czf - -C /app/datos especies sitios uploads 2>/dev/null \
  > "$DESTINO/fotos-$FECHA.tar.gz" || true

# Se tiran las copias más viejas de lo que se quiera conservar.
find "$DESTINO" -name 'pesca-*.db' -mtime "+$CONSERVAR_DIAS" -delete
find "$DESTINO" -name 'fotos-*.tar.gz' -mtime "+$CONSERVAR_DIAS" -delete

echo "$(date '+%Y-%m-%d %H:%M') copia hecha en $DESTINO"
