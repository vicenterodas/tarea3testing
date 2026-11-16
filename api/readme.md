# DCCuote BackEnd

Antes de usar Docker Compose, ejecuta desde esta carpeta:

```sh
node scripts/configurar-entorno.mjs
```

Esto crea la configuración local y una clave de base de datos si no existen.
Las plantillas `*.example` están en el repositorio; los archivos con valores
locales no se suben. El script conserva la configuración previa.

Aplicación mínima para gestionar el backend de un servicio de frases diarias.

> 💡 **Nota:** los comandos de este README usan `docker-compose`. Si no te funciona, prueba con `docker compose` (con espacio en vez de guion). Por ejemplo: `docker compose up`.

## Ejecutar los tests en Docker

Para ejecutar los tests dentro del contenedor de Docker, ejecuta los siguientes comandos desde la carpeta [`api/`](/api/):

1. Construye las imágenes de Docker:

```sh
docker-compose build
```

2. Inicia el contenedor en modo interactivo:

```sh
docker-compose run app sh
```

3. Ya **dentro del contenedor**, ejecuta:

```sh
pytest -q -k .
```

### Reporte de cobertura

La cobertura se configura en `pytest.ini` usando `pytest-cov`.

- Copia el reporte HTML de cobertura a tu máquina local (ejecuta esto fuera de Docker):

```sh
docker cp <container_id>:/app/htmlcov ./htmlcov
```

> 💡 **Tip:** para obtener el `<container_id>`, ejecuta `docker ps` en otra terminal (funciona igual en Mac, Windows y Linux) y copia el valor de la columna `CONTAINER ID` del contenedor que está corriendo.

- Detén el contenedor de Docker:

```sh
docker-compose down
```

Resultados:
- Resumen en la terminal: se muestra al terminar la ejecución de los tests.
- Reporte HTML: `htmlcov/index.html`.

## Levantar la aplicación (Docker)

Para ejecutar la aplicación usando Docker:

1. Construye la imagen de Docker:

```sh
docker-compose build
```

2. Ejecuta el contenedor (la aplicación estará disponible en `http://127.0.0.1:5000`):

```sh
docker-compose up
```

3. Detén y elimina el contenedor:

```sh
docker-compose down
```

## Reiniciar la base de datos

`docker-compose down` detiene los contenedores, pero **conserva los datos** de las bases (`db` y `db_test`). Estos se guardan en los volúmenes `db_data` y `db_test_data`. Si un test falla a mitad de camino, lo que alcanzó a crear sigue ahí la próxima vez que levantes la aplicación.

Para partir con una base limpia, agrega `-v`:

```sh
docker-compose down -v
docker-compose up
```

- `down -v` borra los contenedores y además los volúmenes, es decir, todos los datos.
- Al hacer `up`, Postgres encuentra el volumen vacío y ejecuta los scripts de [`db/init/`](db/init/) en orden: [`01_schema.sql`](db/init/01_schema.sql) crea las tablas y [`02_seed.sql`](db/init/02_seed.sql) inserta los datos iniciales.

> ⚠️ Esos scripts **solo** se ejecutan cuando el volumen está vacío. Sin `-v`, la base no se resetea ni se vuelve a poblar.

## Documentación

Con la aplicación corriendo, puedes revisar la documentación de los endpoints en:

[http://127.0.0.1:5000/apidocs](http://127.0.0.1:5000/apidocs)

