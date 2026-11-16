# Tarea 3: API & End2End Testing

**Para continuar el trabajo, empezar por [CONTINUAR.md](CONTINUAR.md).** Incluye
instalación desde GitHub, resultados validados, los tres tests manuales pendientes
y los pasos para revisar y empaquetar la entrega.

Estado: backend completo (58 tests, 100 % de cobertura), cinco flujos de
integración y seis E2E de IA listos. Queda reescribir tres E2E manuales para llegar
a los diez exigidos; los borradores no se cuentan como manuales terminados.

Este repositorio contiene el código base necesario para el desarrollo de la Tarea 3 del curso de Testing.
La tarea se desarrolla sobre la base de la aplicación **DCCuote** que permite crear, listar y gestionar frases. Tu tarea será escribir una serie de **tests de API y E2E** que validen el comportamiento esperado de la aplicación frente a diferentes interacciones de usuario.

## Estructura del Proyecto
- [`api/`](./api/) → Contiene el backend (Flask API), los archivos docker necesarios para levantarlo, y la estructura base de API testing en pytest.
- [`web/`](./web/) → Contiene el frontend desarrollado con **React** (en TypeScript) y la estructura base de **tests E2E** de Playwright.  

En cada carpeta hay un readme que detalla cómo levantar las aplicaciones.

## Requisitos Previos
- Tener instalado **docker** y **python**
- Tener instalado **Node.js** y **npm**.

## Tests de API e integración implementados

Desde `api/`, con Docker Desktop iniciado:

```sh
node scripts/configurar-entorno.mjs
docker compose up -d --build
docker compose run --rm --no-deps --volume '.:/app' app pytest -q
```

El volumen permite usar los tests actuales sin reconstruir la imagen después de
cada cambio y guarda el reporte de cobertura en `api/htmlcov/index.html`.
Para ejecutar solamente los flujos de integración:

```sh
docker compose run --rm --no-deps --volume '.:/app' app pytest -q tests/integration
```

El script prepara las variables locales a partir de plantillas sin claves; los
archivos `.env` con valores locales no se publican. Los tests usan PostgreSQL de
prueba (`db_test`, definido en `.env.test`). La
fixture `reset_db` reinicia las tablas y carga `02_seed.sql` antes de cada caso.
No ejecutar la suite de API al mismo tiempo que los E2E: la configuración base
también conecta el servicio web al mismo `db_test`.

Los cinco flujos de integración están en `api/tests/integration/`:

1. Crear una frase con personaje y etiquetas nuevos, descubrir esos recursos y
   encontrar la frase por personaje.
2. Añadir etiquetas nuevas y existentes, repetir la solicitud sin duplicar
   relaciones y encontrar la frase por sus etiquetas.
3. Impedir borrar un personaje con frases, borrar su frase y después el personaje.
4. Borrar una etiqueta compartida conservando las frases y sus demás etiquetas.
5. Combinar el filtro por personaje con varias etiquetas y actualizar los
   resultados después de completar las etiquetas de otra frase.

Cada flujo consulta al menos tres endpoints distintos y parte de sus propios
datos. Los tests de API cubren además validaciones, respuestas 400/404/409,
frases sin etiquetas, relaciones repetidas y una base sin frases. El test de
arranque ejecuta el archivo de la aplicación como script y reemplaza únicamente
`Flask.run` para comprobar el arranque sin dejar un servidor bloqueando la suite.

## Tests E2E y parte manual pendiente

En `web/tests/ia/` hay seis tests generados con el Generator oficial de Playwright,
con tags `@ia` y `@codex`. El Planner exploró la aplicación y guardó
`web/tests/plan-planner.md` sin ediciones posteriores; la selección refinada está
en `web/tests/plan-final.md`. El procedimiento está documentado en
`web/docs/playwright-codex.md`.

Desde `web/`, con la API encendida:

```sh
npx playwright test --trace on
npx playwright show-report
```

Dos tests tienen `bug` en el nombre y fallos esperados con `test.fail`:

- Combinar búsqueda y personaje: seleccionar personaje descarta el texto buscado.
- Repetir una etiqueta: la UI muestra dos copias, aunque la API conserva una.

Ambos se ejecutan con assertions del comportamiento correcto; no están omitidos.
Los errores de preparación anteriores a la marca de fallo siguen siendo errores
inesperados. No se modificó la aplicación para ocultar estos bugs.

**Pendiente antes de entregar:** el estudiante eligió reescribir tres borradores
de tests manuales. Están en `web/tests/borradores-manuales.spec.ts.txt`, con guía
en `web/tests/guia-manuales.md`. Se validaron por separado con `@borrador`; no se
ejecutan en la suite y no se presentan como escritos manualmente por el estudiante.
Actualmente hay siete tests activos: un manual del código base y seis de IA.
Cuando estén reescritos y etiquetados `@manual`, la suite debe contener exactamente
diez: cuatro manuales y seis de IA. `seed.spec.ts` permanece como configuración y
no cuenta entre los diez.

La fixture de E2E crea textos únicos y limpia sus recursos incluso ante fallos,
conservando personajes, etiquetas y frases preexistentes.

## Entrega

Para entregar tu tarea, genera un `.zip` con el siguiente comando, ejecutado desde la raíz del proyecto (la carpeta que contiene `api/` y `web/`):

```bash
git archive --format=zip --prefix=dccuote/ -o tarea3.zip HEAD
```

Este comando arma el `.zip` solo con los archivos que git tiene registrados, así que deja fuera automáticamente todo lo que está en los `.gitignore` (`node_modules/`, `venv/`, `htmlcov/`, etc.) y la carpeta `.git`.

> ⚠️ **Importante:** el comando empaqueta tu **último commit** (`HEAD`), no el estado actual de tus archivos. Cualquier cambio que no hayas commiteado **no quedará en la entrega**. Antes de generar el `.zip`, asegúrate de commitear todo:
>
> ```bash
> git add .
> git commit -m "Entrega Tarea 3"
> ```
>
> Puedes revisar con `git status` que no queden cambios pendientes.

> 💡 **Nota:** si tu carpeta todavía no es un repositorio de git (por ejemplo, si descargaste el código como `.zip`), primero ejecuta `git init` en la raíz del proyecto y luego haz el commit de arriba.
