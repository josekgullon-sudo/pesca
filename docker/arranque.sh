#!/bin/sh
# Arranque en producción: primero deja la base de datos al día, luego levanta.
#
# Migrar al arrancar es lo correcto aquí: es un despliegue de un solo proceso y
# `migrate deploy` no hace nada si no hay migraciones pendientes. Con varias
# réplicas habría que sacarlo a un paso previo del despliegue.
set -e

echo "→ Aplicando migraciones..."
npx prisma migrate deploy

# El seed es idempotente: crea lo que falte, no pisa contraseñas ni fotos.
if [ "${SEMBRAR_AL_ARRANCAR:-si}" = "si" ]; then
  echo "→ Cargando datos base..."
  npx prisma db seed
fi

echo "→ Arrancando el servidor..."
exec npm run start
