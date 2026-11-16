# DCCuote: plan final de E2E

Selección refinada a partir de la exploración del Planner oficial de Playwright.
`plan-planner.md` conserva la salida original sin editar. Seed para todos los
escenarios: `tests/seed.spec.ts`, proyecto `chromium`.

## Alcance y origen

La entrega final tendrá exactamente 10 tests: el ejemplo manual existente, tres
manuales que reescribirá el estudiante y los seis casos de IA siguientes. Los
borradores `.spec.ts.txt` están excluidos y no cuentan como manuales terminados.

| Origen | Flujo | Archivo |
| --- | --- | --- |
| Manual existente | Crear frase con personaje existente y abrirla desde el aviso | `tests/example.spec.ts` |
| Manual pendiente | Cancelar creación y descartar datos | Reescribir en `tests/manual.spec.ts` |
| Manual pendiente | Buscar texto y recuperar listado | Reescribir en `tests/manual.spec.ts` |
| Manual pendiente | Abrir detalle desde la lista y recargar | Reescribir en `tests/manual.spec.ts` |
| IA1 | Filtrar por personaje y volver a Todos | `tests/ia/filter-character.spec.ts` |
| IA2 | Cancelar y luego confirmar eliminación de una frase | `tests/ia/delete-quote.spec.ts` |
| IA3 | Añadir etiquetas y conservarlas al recargar | `tests/ia/add-tags.spec.ts` |
| IA4 | Corregir un formulario inválido y enviarlo | `tests/ia/invalid-form.spec.ts` |
| IA5 | bug: combinar búsqueda con filtro de personaje | `tests/ia/combined-filters-bug.spec.ts` |
| IA6 | bug: no duplicar visualmente una etiqueta existente | `tests/ia/duplicate-tag-bug.spec.ts` |

## Reglas comunes de generación

- Usar `generator_setup_page` por escenario, ejecutar los pasos y verificar
  selectores en vivo, leer el log e inmediatamente guardar el test con
  `generator_write_test`, siguiendo la definición oficial instalada.
- Un test por archivo, dentro de un `describe`, con comentarios `// spec:` y
  `// seed:`. Tags de los seis: `['@ia', '@codex']`.
- Importar `test` y `expect` desde `../support/test-data` en los archivos de `ia/`.
  La fixture aporta `testData.token`, `testData.api`, `createQuote` y `trackQuote`.
- API real en `http://127.0.0.1:5000`; frontend configurado en
  `http://localhost:4173`. No usar `localhost:5000` (AirPlay en este Mac).
- Preparar recursos propios por API usando UUID y acciones principales por UI.
  No modificar los datos iniciales, la aplicación ni el backend.
- Registrar cualquier frase creada desde la UI con `trackQuote` inmediatamente
  después de recibir el POST, antes de assertions de presentación. La fixture
  limpia frases y recursos propios en `finally`, incluso si el test falla.
- No usar esperas de tiempo fijo, `networkidle`, respuestas simuladas ni selectores
  CSS dependientes del estilo. Preferir roles, etiquetas y `data-testid`.
- Los bugs conservan assertions del comportamiento correcto. Usar `test.fail`
  inmediatamente antes de la assertion específica que evidencia el fallo, con
  explicación. No usar `skip`, `fixme`, condiciones para esconder el fallo ni
  modificar la app para que pase. Un fallo anterior debe seguir siendo inesperado.

## 1. Catálogo y eliminación

### IA1. Filtrar por personaje y volver a Todos

Preparación: crear dos frases propias con personajes distintos y nombres únicos.

1. Abrir `/quotes` y comprobar que ambas frases se muestran.
2. Abrir el combobox de personaje y seleccionar el personaje de la primera.
3. Comprobar que la primera frase sigue visible y la otra no aparece. Las tarjetas
   visibles deben corresponder al personaje seleccionado.
4. Seleccionar `Todos` sin introducir búsqueda de texto.
5. Comprobar que ambas frases vuelven a aparecer.

Resultado: el filtro de personaje limita la lista y puede retirarse. La limpieza
elimina las dos frases y sus personajes propios.

### IA2. Cancelar y luego confirmar eliminación de una frase

Preparación: una frase propia con personaje existente, sin etiquetas nuevas.

1. Abrir `/quotes`, localizar la tarjeta propia y activar `Psycho Killer Mode`
   mediante el rol `switch` (su etiqueta HTML está mal asociada).
2. Abrir el botón de papelera de esa tarjeta. Comprobar que el diálogo incluye el
   texto de la frase. Cancelar.
3. Comprobar que la tarjeta permanece y que la API todavía devuelve la frase.
4. Volver a abrir la confirmación y pulsar `Eliminar`.
5. Comprobar que se cierra el diálogo y desaparece la tarjeta.
6. Recargar y comprobar que sigue ausente; la API debe devolver 404.

Resultado: cancelar preserva la frase; confirmar la elimina de forma persistente.
El teardown admite 404 para ese ID propio ya eliminado.

## 2. Etiquetas y validación

### IA3. Añadir etiquetas y conservarlas al recargar

Preparación: una frase propia sin etiquetas, personaje existente.

1. Abrir su detalle, comprobar texto y pulsar `Add Tag`.
2. Escribir ` science, nueva-<UUID>, , life ` y pulsar `Agregar etiquetas`.
3. Comprobar éxito y cierre del diálogo. Deben aparecer exactamente las tres
   etiquetas normalizadas: `science`, `nueva-<UUID>` y `life`, una vez cada una.
4. Consultar la frase por API y comprobar nombres e IDs persistidos.
5. Recargar la página y comprobar que las tres etiquetas siguen visibles.

Resultado: se recortan espacios, se omiten entradas vacías y las etiquetas quedan
guardadas. El teardown descubre la etiqueta nueva antes de borrar la frase.

### IA4. Corregir un formulario inválido y enviarlo

Preparación: texto único; usar `Marie Curie`, que existe en el seed.

1. Abrir `Nueva frase`, escribir texto propio y seleccionar `Marie Curie`.
2. Dejar `Fuente` vacía y pulsar `Añadir`.
3. Comprobar error visible `La fuente no es válida`, que el diálogo sigue abierto
   y que el texto y el personaje seleccionados se conservan. La API debe devolver
   400 y no debe existir una frase con ese texto.
4. Completar la fuente y volver a pulsar `Añadir`. Capturar la respuesta 201 y
   registrar la frase para limpieza antes de las siguientes comprobaciones.
5. Comprobar éxito, abrir `Ver` y verificar texto, personaje y fuente en el detalle.

Resultado: el usuario puede recuperar un envío inválido sin reescribir todo.

## 3. Bugs de la aplicación

### IA5. bug: combinar búsqueda con filtro de personaje

Preparación: tres frases propias. A y B comparten personaje único; A incluye un
fragmento único `Coincidencia <UUID>` y B no. C tiene otro personaje e incluye el
mismo fragmento que A. Crear todo antes de abrir la página.

1. Abrir `/quotes`, buscar el fragmento y comprobar que aparecen A y C, pero no B.
2. Seleccionar el personaje de A y B.
3. Comprobar que C desaparece y A continúa visible.
4. Marcar el fallo conocido justo antes de comprobar que B no aparece y que la
   grilla contiene una sola tarjeta: la combinación debe aplicar ambos filtros.

Comportamiento correcto: solo A. Bug observado por Planner: seleccionar personaje
descarta el filtro de texto y también muestra B. No aceptar B ni quitar la búsqueda
para que pase. El error pertenece a `QuotesGrid.tsx`.

### IA6. bug: no duplicar visualmente una etiqueta existente

Preparación: frase propia con la etiqueta existente `science`.

1. Abrir su detalle y comprobar que `science` aparece una sola vez.
2. Pulsar `Add Tag`, enviar `science` y esperar el éxito y cierre del diálogo.
3. Comprobar por API que solo existe una relación con esa etiqueta.
4. Marcar el fallo conocido justo antes de comprobar que la UI sigue mostrando
   exactamente una instancia de `science`.

Comportamiento correcto: una etiqueta visible. Bug confirmado por Planner: la UI
pasa de una a dos copias; la API conserva una y al recargar vuelve a verse una.
El test debe detectar la duplicación antes de recargar; no recargar para ocultarla.
El error pertenece a la concatenación de etiquetas de `QuoteView.tsx`.

## Reservas descartadas

El error silencioso al agregar etiquetas vacías y la actualización del catálogo
de personajes después de crearlos quedan documentados en la exploración, pero no
añaden tests a la suite: se priorizan seis resultados diferentes y reproducibles.
