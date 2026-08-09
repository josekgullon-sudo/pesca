/**
 * Qué versión corre dentro del contenedor.
 *
 *     docker exec -t pesca-app-1 npx tsx scripts/version.mjs
 *
 * Existe porque no había forma de saberlo, y eso costó tres diagnósticos
 * equivocados seguidos: se lanzaba un comando antes de que el despliegue
 * hubiera entrado, salía el comportamiento de la versión anterior, y parecía
 * un fallo del código nuevo.
 */
const version = process.env.VERSION_APP ?? "desconocida";

console.log(`\nVersión desplegada: ${version}`);
if (version === "desconocida") {
  console.log(
    "\nEsta imagen se construyó antes de que existiera el marcador, así que\n" +
      "es de un despliegue anterior a él. En cuanto entre el siguiente, esto\n" +
      "dirá el commit exacto.",
  );
} else {
  console.log(`\nEn GitHub: https://github.com/josekgullon-sudo/pesca/commit/${version}`);
}
