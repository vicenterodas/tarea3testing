import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Uso: node scripts/configurar-entorno.mjs [directorio-api]
// Las claves se generan localmente y nunca se imprimen ni se incluyen en Git.
const root = process.argv[2]
  ? resolve(process.argv[2])
  : resolve(dirname(fileURLToPath(import.meta.url)), '..');

function readPassword(name) {
  const path = resolve(root, name);
  if (!existsSync(path)) return undefined;
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*DB_PASSWORD\s*=\s*(.*)$/);
    if (!match) continue;
    const raw = match[1].trim();
    const value = raw.replace(/^(['"])(.*)\1$/, '$2');
    if (value) return value;
  }
  return undefined;
}

const envPath = resolve(root, '.env');
if (existsSync(envPath) && !readPassword('.env')) {
  console.error('api/.env ya existe, pero DB_PASSWORD está vacío. Completa ese valor y repite.');
  process.exit(1);
}

// Reutilizar la configuración previa preserva el acceso a volúmenes existentes.
const password = readPassword('.env') ?? readPassword('.env.test')
  ?? readPassword('.env.prod') ?? randomBytes(24).toString('hex');

// Validar plantillas antes de escribir para no dejar una preparación a medias.
for (const name of ['.env.test', '.env.prod']) {
  if (!existsSync(resolve(root, name)) && !existsSync(resolve(root, `${name}.example`))) {
    console.error(`Falta la plantilla ${name}.example en ${root}`);
    process.exit(1);
  }
}

if (!existsSync(envPath)) {
  // JSON.stringify conserva caracteres especiales de una clave previa en .env.
  writeFileSync(envPath, `DB_PASSWORD=${JSON.stringify(password)}\n`, { flag: 'wx', mode: 0o600 });
}
for (const name of ['.env.test', '.env.prod']) {
  const path = resolve(root, name);
  if (!existsSync(path)) {
    writeFileSync(path, readFileSync(resolve(root, `${name}.example`)), { flag: 'wx', mode: 0o600 });
  }
}
console.log('Entorno local preparado. Se conservaron los archivos existentes y no se muestran claves.');
