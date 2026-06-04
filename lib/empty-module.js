/**
 * Module vide servant de remplacement aux imports `node:*` côté client.
 *
 * Référencé par next.config.mjs via NormalModuleReplacementPlugin :
 * tous les imports `import { ... } from "node:fs"` (et similaires) dans le
 * bundle client deviennent ce module no-op. Les fonctions exportées sont
 * des stubs qui throw si appelés — mais l'idée est qu'ils ne le soient
 * JAMAIS côté client (seul le code serveur les utilise).
 *
 * On exporte juste les noms les plus courants avec des stubs. Si un client
 * component appelle vraiment l'un d'eux (bug), il aura une erreur claire.
 */

function notInBrowser() {
  throw new Error(
    "node:* APIs not available in browser bundle. This indicates a bug : a client component is invoking a server-only function.",
  );
}

const stub = new Proxy(
  {},
  {
    get(_t, prop) {
      // Quelques propriétés courantes
      if (prop === "default") return stub;
      if (prop === "promises") return stub;
      if (prop === Symbol.toPrimitive) return () => "[empty-node-module]";
      // Fonctions stub
      return notInBrowser;
    },
  },
);

module.exports = stub;
module.exports.default = stub;
module.exports.promises = stub;
