# Continuar la Tarea 3 de Testing

Repositorio: <https://github.com/vicenterodas/tarea3testing>

Este proyecto está preparado para continuar el trabajo. **Todavía no es la entrega
final:** faltan tres tests E2E escritos manualmente y la revisión de cierre.
El enunciado original está en [`t3.pdf`](t3.pdf).

## Qué está listo

| Parte | Última validación |
| --- | --- |
| Backend, pytest | 58 tests aprobados; 100 % de cobertura de líneas |
| Integración de API | 5 flujos, cada uno con al menos 3 endpoints distintos |
| E2E generado con agentes de Playwright | 6 tests con `@ia` y `@codex` |
| Ejemplo E2E manual del código base | 1 test con `@manual` |
| Plan original del Planner | `web/tests/plan-planner.md`, preservado sin cambios |
| Plan refinado | `web/tests/plan-final.md` |
| Tres borradores para reescritura manual | Probados por separado; todavía no cuentan como manuales |

La suite E2E activa tiene **7 tests**: cinco pasan normalmente y dos reproducen
bugs conocidos mediante `test.fail`. Playwright informa `7 passed` porque los dos
fallos coinciden con lo esperado. No hay tests omitidos ni fallos inesperados en
la última ejecución validada. La limpieza conservó todos los datos iniciales.

## 1. Clonar y levantar el proyecto

Requisitos para usarlo y ejecutar los tests: Git, Docker Desktop encendido,
Node.js y npm. No hace falta tener Python instalado en el host para ejecutar el
backend: se ejecuta en Docker. Python 3.11+ y Codex CLI solo son necesarios si se
quiere volver a ejecutar el script opcional de agentes; los tests generados ya
están incluidos.

```sh
git clone https://github.com/vicenterodas/tarea3testing.git
cd tarea3testing
cd api
node scripts/configurar-entorno.mjs
docker compose up -d --build
```

La documentación de la API debe responder en <http://127.0.0.1:5000/apidocs/>.
El script genera una clave local aleatoria y crea `.env`, `.env.test` y `.env.prod`
a partir de las plantillas incluidas. Los archivos con valores locales quedan
fuera de Git. Si ya había configuración, se conserva para seguir accediendo a los
volúmenes existentes. Docker Compose inyecta la misma clave a la aplicación y a
PostgreSQL. La plantilla `.env.prod.example` también describe una base local; no
configura un despliegue público.

Desde la raíz del repositorio, para usar la aplicación visualmente:

```sh
cd web
npm ci
npx playwright install chromium
npm run dev
```

Abrir la URL que muestra Vite, normalmente <http://localhost:5173/>.

Para ejecutar E2E no es necesario dejar `npm run dev` encendido: Playwright
construye y levanta su propia web en el puerto 4173. Sí necesita la API encendida.

## 2. Ejecutar las pruebas existentes

Backend, desde `api/`:

```sh
docker compose run --rm --no-deps --volume '.:/app' app pytest -q
```

Resultado de referencia: **58 passed, 100 % de cobertura**. El reporte HTML se
genera en `api/htmlcov/index.html`.

E2E, desde `web/` y después de que termine pytest:

```sh
npx playwright test --trace on --workers=2
npx playwright show-report
```

Resultado de referencia actual: **7 passed**, incluidos los dos bugs esperados.
El reporte HTML queda en `web/playwright-report/`; el JSON queda en
`web/test-results/results.json`. Las trazas permiten revisar acciones y estado de
la página paso a paso. Los reportes y las dependencias se regeneran localmente y
no se suben al repositorio.

**Ejecutar las suites de forma secuencial.** La configuración original conecta la
aplicación a `db_test`, y la fixture de pytest borra y repuebla esa base antes de
cada test. Ejecutar pytest durante los E2E o mientras se ingresan datos manualmente
en la web puede alterar el estado de esa sesión.

## 3. Trabajo pendiente: tres tests manuales

Punto de partida:

- [`web/tests/guia-manuales.md`](web/tests/guia-manuales.md): objetivos y comandos.
- [`web/tests/borradores-manuales.spec.ts.txt`](web/tests/borradores-manuales.spec.ts.txt):
  borradores preparados con IA, no incluidos en la ejecución ni en el conteo.
- [`web/tests/support/test-data.ts`](web/tests/support/test-data.ts): fixture
  reutilizable para preparar datos propios y limpiarlos, incluso ante un fallo.

Crear **`web/tests/manual.spec.ts`** y reescribir estos tres flujos:

1. Cancelar la creación de una frase y comprobar que se descartan los datos.
2. Buscar por texto sin distinguir mayúsculas, comprobar un resultado vacío y
   recuperar el listado al limpiar la búsqueda.
3. Abrir una frase desde el listado y comprobar texto, personaje, fuente y
   etiquetas antes y después de recargar.

Usar `@manual` en las versiones reescritas. No basta con renombrar los borradores
y cambiar su tag: están identificados como preparados con ayuda de IA. El ejemplo
de `web/tests/example.spec.ts` ya cuenta como el primer manual; no crear otro test
del mismo flujo ni eliminar ese ejemplo.

En `manual.spec.ts`, la fixture se importa así:

```ts
import { test, expect } from './support/test-data';
```

La fixture ofrece `testData.token` para textos únicos, `createQuote(...)` para
preparar una frase por API, `api` para consultas y `trackQuote(...)` para registrar
una frase creada desde la UI. Las acciones que se quieren probar deben realizarse
en el navegador. No añadir un test por cada assertion: se necesitan tres flujos,
un test por flujo, con resultados distintos.

## 4. Bugs documentados: no esconderlos para obtener verde

Los dos tests de bugs usan `test.fail` justo antes de sus comprobaciones finales:

- **Búsqueda + personaje:** seleccionar un personaje ignora el texto de búsqueda.
  Archivo: `web/tests/ia/combined-filters-bug.spec.ts`.
- **Etiqueta repetida:** la UI muestra dos copias, aunque la API conserva una.
  Archivo: `web/tests/ia/duplicate-tag-bug.spec.ts`.

El enunciado permite señalar bugs con pruebas que fallen y los nombres ya incluyen
`bug`. No convertirlos en `skip`/`fixme`, invertir sus assertions ni modificar la
aplicación para ocultarlos. Si la aplicación se corrige deliberadamente más
adelante, revisar la marca de fallo esperado: un pase inesperado requiere atención.

La exploración del Planner también documentó otros hallazgos, pero se
seleccionaron solo seis flujos de IA para respetar el máximo de la tarea.

## 5. Verificar el conteo y cerrar la entrega

Después de escribir los tres manuales, ejecutar desde `web/`:

```sh
npx playwright test --list
npx playwright test --list --grep @manual
npx playwright test --list --grep @ia
npx playwright test --trace on --workers=2
```

Debe haber exactamente:

- **10 tests activos** en total.
- **4 manuales**: el ejemplo y los tres nuevos.
- **6 de IA**: todos con `@ia` y `@codex`.
- Ningún `seed` ni borrador en el reporte; ningún `test.only`, `skip` o `fixme`.
- Ningún fallo inesperado. Si los dos bugs siguen presentes, habrá ocho tests con
  estado real `passed` y dos con estado real `failed` esperado; el resumen mostrará
  diez resultados aprobados.

Antes del ZIP:

- [ ] Los tres manuales están reescritos y validados, incluidos de forma aislada.
- [ ] La suite completa contiene 10 tests con la distribución 4/6.
- [ ] Backend conserva los 58 tests aprobados y 100 % de cobertura.
- [ ] `plan-planner.md` no fue editado. Su SHA-256 está documentado en
  `web/docs/playwright-codex.md`.
- [ ] Actualizar las secciones de pendientes en `README.md`, este archivo,
  `web/tests/guia-manuales.md`, `web/tests/plan-final.md` y
  `web/docs/playwright-codex.md` según lo efectivamente terminado.
- [ ] Guardar los cambios y subirlos a GitHub antes de generar el archivo final.

Desde la raíz del repositorio:

```sh
git status
git add README.md CONTINUAR.md web/tests web/docs
git commit -m "Completar tests E2E manuales y revisar entrega"
git push origin main
git archive --format=zip --prefix=dccuote/ -o tarea3.zip HEAD
```

Si se cambiaron otros archivos, revisarlos y agregarlos también al commit.
`git archive` empaqueta el último commit, no los cambios sin guardar. Revisar el
ZIP y comprobar que incluya código, tests, planes y README, y excluya
`node_modules`, `htmlcov`, `dist`, `test-results`, `playwright-report` y `.git`.
La entrega final se sube a Canvas; subir el código a GitHub no reemplaza ese paso.

## Dónde está cada cosa

| Ruta | Contenido |
| --- | --- |
| `api/src/` | Backend Flask y lógica de datos |
| `api/tests/unit/` | Validación, endpoints, casos vacíos y arranque |
| `api/tests/integration/` | Cinco flujos de integración |
| `web/src/` | Frontend React del código base |
| `web/tests/ia/` | Seis tests generados con Playwright/Codex |
| `web/tests/example.spec.ts` | Ejemplo manual existente |
| `web/tests/manual.spec.ts` | Archivo que falta escribir |
| `web/tests/support/test-data.ts` | Preparación y limpieza de datos E2E |
| `web/tests/plan-planner.md` | Plan original, conservar intacto |
| `web/tests/plan-final.md` | Selección refinada de flujos |
| `web/docs/playwright-codex.md` | Procedencia y validación de los agentes |

## Problemas comunes

- **Docker no conecta:** iniciar Docker Desktop antes de `docker compose`.
- **Falta DB_PASSWORD o .env.test:** ejecutar `node scripts/configurar-entorno.mjs`
  desde `api/` antes de usar Docker Compose. Si se creó `.env` manualmente con una
  clave vacía, completarla primero.
- **403 en API en macOS:** usar `127.0.0.1:5000`, no `localhost:5000`; este último
  puede responder desde AirPlay. El frontend y la fixture ya usan IPv4 explícita.
- **Puerto 4173 ocupado:** detener el preview anterior antes de ejecutar Playwright.
- **Navegador no instalado:** ejecutar `npx playwright install chromium` en `web/`.
- **Los tests nuevos no aparecen:** verificar nombre `*.spec.ts` y carpeta
  `web/tests/`; el borrador termina en `.txt` deliberadamente.
- **Datos distintos de los iniciales:** `docker compose down` conserva volúmenes.
  `docker compose down -v` los elimina; usarlo solo si se quiere descartar todos
  los datos locales de esta aplicación y volver a cargar el seed.
