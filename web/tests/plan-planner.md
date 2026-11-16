# Plan original de pruebas de DCCuote — exploración y selección de flujos

## Application Overview

Plan original en español para DCCuote, explorado en Chromium el 15-11-2026 mediante MCP Playwright Test. Se leyó la definición oficial instalada en node_modules/playwright/lib/agents/playwright-test-planner.agent.md. planner_setup_page se invocó una sola vez con tests/seed.spec.ts y proyecto chromium. El seed/webServer abre http://localhost:4173. No se generaron tests, no se ejecutó pytest ni se modificó aplicación, configuración o tests existentes.

### Alcance y reparto recomendado

El lector consulta frase diaria, catálogo, búsqueda y detalles; el colaborador crea frases y agrega etiquetas; el usuario que depura activa Psycho Killer Mode y confirma eliminaciones. Navegación visible: Frases, Frase diaria y Nueva frase. Las etiquetas tienen apariencia interactiva, pero no se constató navegación por etiqueta; no suponer pantallas de administración de personajes o etiquetas.

Hay 15 flujos candidatos: M1–M4, IA1–IA6 y R1–R5. La selección recomendada suma exactamente 10 tests: el ejemplo M1 existente ya ocupa 1 de los 4 manuales; M2, M3 y M4 quedan reservados para que el usuario los escriba manualmente. Los seis adicionales para generación posterior por IA son IA1–IA6. Los cinco R son alternativas, no tests adicionales de la entrega de diez. IA5 e IA6 documentan regresiones reales y deben fallar con el comportamiento actual; no adaptar su resultado esperado al bug. La selección/refinamiento posterior pertenece a tests/plan-final.md; preservar este archivo original sin editar. Las rutas File son propuestas para trabajo futuro, no archivos creados por este plan. Etiquetas futuras: @manual para M; @ia y @codex para IA. El seed no cuenta como test.

### Estado inicial fresco y datos

Cada escenario empieza desde contexto limpio, sin estado de navegador previo, y prepara sus propios recursos; puede ejecutarse en cualquier orden. «Fresco» no significa vaciar la base de datos. La exploración encontró 10 frases, 9 personajes y 7 etiquetas. Incluye el registro inicial «Una etiqueta repetida no duplica la relación.» de Marie Curie, fuente Prueba de etiquetas: también debe conservarse. Los datos iniciales incluyen Einstein, Newton, Curie, Roosevelt, Gandalf, Elend Venture, Sazed, Uncle Iroh y Aang; etiquetas science, inspiration, life, moustache, no moustache, fantasy y wisdom. Si falta un dato inicial usado en solo lectura, informar precondición incumplida; no simular un éxito ni borrar/resembrar la base.

Toda petición directa de datos, preparación y limpieza usa exclusivamente http://127.0.0.1:5000. Nunca localhost:5000: responde AirPlay 403 en este entorno. Antes de cada escenario guardar GET /quotes, GET /characters y GET /tags, incluyendo IDs y valores relevantes. Sustituir <UUID> por un UUID nuevo por escenario/ejecución; todas las frases, personajes y etiquetas creados deben tener nombres/textos únicos. Los personajes y etiquetas iniciales pueden reutilizarse sin crearlos ni eliminarlos.

Para preparar un recurso propio: POST /quotes/add con JSON {quote, character, source, tags}; esperar 201 y registrar inmediatamente frase.id, character.id y cada tags[].id. Solo la preparación y limpieza pueden usar API: la acción funcional descrita se realiza en la interfaz. Registrar también cada etiqueta creada desde el detalle en la respuesta POST /quotes/<id>/tags; si falla una assertion antes del registro, recuperar el detalle o buscar exactamente los nombres únicos propios en GET /tags y GET /characters. No depender de variables globales entre llamadas MCP. En tests futuros puede aprovecharse la fixture existente tests/support/test-data.ts; revisar que cubra todos los recursos del escenario antes de usarla.

### Limpieza garantizada y criterios comunes

Ejecutar finally/teardown incluso ante errores, cierres de diálogo fallidos o assertions fallidas. Primero DELETE /quotes/delete/<id propio>; después DELETE /characters/delete/<id propio> y DELETE /tags/delete/<id propio>. Seguir con los demás recursos si una eliminación falla, acumular e informar errores. Aceptar 200 y 404 para recursos propios ya borrados; un 400/500 no prueba limpieza exitosa. La eliminación funcional por UI también usa la API IPv4; repetir en teardown es idempotente. Nunca borrar IDs iniciales ni borrar masivamente todo lo que no estaba en el inventario: otra ejecución podría estar trabajando en paralelo. Limpiar solo IDs/nombres únicos registrados como propios. Confirmar ausencia de los recursos propios y conservación de IDs, contenido y relaciones iniciales.

Esperar respuestas y actualizaciones de UI con condiciones, no con pausas arbitrarias. Guardar cuerpos de respuesta antes de recargar/navegar. La grilla tiene data-testid=quotes-grid; la papelera carece de nombre accesible, por lo que debe localizarse dentro de la tarjeta con el texto único propio. Acotar combobox al diálogo o al catálogo; el buscador emergente usa placeholder Search or create new y opciones por nombre. El campo de etiquetas del detalle tiene placeholder chile, humor, tv. Ningún flujo necesita capturas de pantalla. Cada escenario tiene éxito únicamente si cumple todas sus expectativas y limpia; cualquier discrepancia es fallo y debe conservar evidencia.

### Hallazgos comprobados en vivo

- **B1 — Búsqueda ignorada al cambiar personaje.** Buscar Life happens wherever deja una frase; seleccionar Uncle Iroh sin cambiar el texto muestra sus dos frases, incluida Sometimes. Al cambiar la búsqueda a Sometimes se vuelve a una. Seleccionar Todos manteniendo texto devuelve todo el catálogo. Evidencia reproducida en MCP con el desplegable ya cerrado; no es solo una lectura antes del render.
- **B2 — Todos bloquea búsquedas posteriores.** Tras seleccionar Todos, escribir Life happens wherever deja la grilla vacía pese a existir la frase inicial. Confirmado por snapshot estable con textbox y Todos seleccionados.
- **B3 — Etiqueta repetida duplicada en UI.** En la frase propia 23e07bb66c87d1697ddb909a88d8c3eccf158558ef8f8de6356dcb0ae84eff81, repetir extra-plan-1794761088212 devolvió 201. Conteo: UI antes=1, UI después=2, GET detalle=1, UI después de recarga=1. La relación persistida no está duplicada; el fallo observado está en la presentación.
- **B4 — Error de etiquetas invisible.** POST /quotes/23e07bb66c87d1697ddb909a88d8c3eccf158558ef8f8de6356dcb0ae84eff81/tags con tags=[] devolvió 400 y {error: "No se proporcionó ninguna etiqueta"}. El snapshot del diálogo mantuvo solo campo y botones, sin alerta ni mensaje; la consola registró Failed to add tags. En contraste, Nueva frase vacía sí mostró Faltan campos obligatorios.
- **B5 — Selector de personajes desactualizado.** Después de crear Personaje plan-1794761088212 desde el formulario en /quotes, el catálogo mostró la frase nueva, pero el filtro no ofreció el autor y mostró Create con su nombre. Tras recargar apareció como option y el filtrado funcionó.

No se corrigió ni ocultó ninguno de estos hallazgos. M2, M3, filtro aislado, detalle, agregar etiqueta válida, cancelar borrado y confirmar borrado se ejercitaron en la app real. R4 es una propuesta de cobertura aún no comprobada en vivo; los resultados deseados de las regresiones no describen el estado actual.

### Evidencia de recursos y cierre de exploración

La única frase persistida de exploración fue «Exploración única plan-1794761088212» (ID anterior), con personaje Personaje plan-1794761088212, ID 42193e39b78a1217a2d2ff4a927f8649f14cd40ab613d3af9601bb58127730f8. Se crearon dos etiquetas que no existían entre las siete iniciales: etiqueta-undefined (ID 7b178aaddc06f6fc23b6955b8adb1911ffe4dc0de99966fa0f15a0c1452ee9ab) y extra-plan-1794761088212 (ID 8daaf55370b4fd3ba71a2b5cdbe99ed5805ff523535669e42ba299b4f9ea0abf). El valor Fuente undefined y el primer nombre de etiqueta procedieron de una variable del explorador que no persistió entre llamadas; no se atribuyen a un bug de DCCuote. Todos estos valores eran distintos de los datos iniciales y fueron eliminados.

Cancelar la eliminación conservó GET detalle=200; confirmar produjo DELETE=200, tarjeta ausente y GET detalle=404. Teardown por IPv4 confirmó DELETE frase=404 y DELETE de ambas etiquetas y personaje=200. GET finales devolvieron 10 frases, 9 personajes y las 7 etiquetas iniciales; la frase inicial adicional de Curie permaneció. No quedaron recursos propios. No se ejecutó pytest, ni una limpieza/reinicio general de datos E2E.

## Test Scenarios

### 1. Flujos manuales: ejemplo existente y tres reservas para el usuario

**Seed:** `tests/seed.spec.ts`

#### 1.1. M1 — Creación exitosa: ejemplo manual existente, ya ocupa 1 de 4

**File:** `tests/example.spec.ts`

**Steps:**
  1. Estado inicial independiente: abrir un contexto limpio de Chromium en http://localhost:4173; aplicar el protocolo de datos y limpieza descrito arriba. Datos: frase «La poderosa nueva frase de prueba <UUID>», personaje inicial Marie Curie, fuente Speech y etiqueta inicial science; no crear otra prueba del mismo flujo.
    - expect: No hay búsqueda, filtro, diálogos ni Psycho Killer Mode heredados de otro escenario.
  2. Abrir Nueva frase; completar Frase, elegir Marie Curie en Personaje y completar Fuente y Etiquetas; pulsar Añadir.
    - expect: POST /quotes/add devuelve 201; registrar inmediatamente el ID de la frase.
    - expect: Aparece «Frase añadida exitosamente» y se cierra el formulario.
  3. Pulsar Ver en la notificación.
    - expect: La ruta /quotes/<id> presenta un encabezado de nivel 1 con la frase exacta; autor, fuente y etiqueta coinciden.
  4. Limpieza obligatoria en finally/teardown, incluso si falla un paso: eliminar únicamente la frase propia; conservar Marie Curie y science por la API http://127.0.0.1:5000, según el registro de IDs; verificar ausencia y conservación del inventario inicial.
    - expect: Éxito: se cumplen todas las expectativas funcionales y la limpieza termina. Fallo: cualquier resultado distinto, recurso propio residual o modificación de datos iniciales; conservar evidencia, no relajar assertions.

#### 1.2. M2 — Reservado al usuario: cancelar una nueva frase

**File:** `tests/manual/cancelar-nueva-frase.spec.ts`

**Steps:**
  1. Estado inicial independiente: abrir un contexto limpio de Chromium en http://localhost:4173; aplicar el protocolo de datos y limpieza descrito arriba. Datos locales: «Cancelada <UUID>», fuente «Fuente <UUID>»; no enviar el formulario.
    - expect: No hay búsqueda, filtro, diálogos ni Psycho Killer Mode heredados de otro escenario.
  2. Ir a Frases, abrir Nueva frase y escribir los datos locales en Frase y Fuente.
    - expect: El diálogo muestra el borrador.
  3. Pulsar Cancelar; volver a abrir Nueva frase.
    - expect: El diálogo se cerró sin POST /quotes/add.
    - expect: Frase, Fuente y Etiquetas están vacíos; Personaje vuelve a «Selecciona o crea un personaje».
  4. Cerrar con Cancelar y comparar GET /quotes con el inventario inicial.
    - expect: No existe ninguna frase con el UUID; no cambió ninguna frase inicial.
  5. Limpieza obligatoria en finally/teardown, incluso si falla un paso: no se crearon recursos; cerrar el contexto y comprobar que no cambió la API.
    - expect: Éxito: se cumplen todas las expectativas funcionales y la limpieza termina. Fallo: cualquier resultado distinto, recurso propio residual o modificación de datos iniciales; conservar evidencia, no relajar assertions.

#### 1.3. M3 — Reservado al usuario: búsqueda textual sin distinguir mayúsculas

**File:** `tests/manual/buscar-frases.spec.ts`

**Steps:**
  1. Estado inicial independiente: abrir un contexto limpio de Chromium en http://localhost:4173; aplicar el protocolo de datos y limpieza descrito arriba. Usar solo lectura: frase inicial de Albert Einstein «Life is like riding a bicycle. To keep your balance you must keep moving.»; el filtro permanece sin seleccionar.
    - expect: No hay búsqueda, filtro, diálogos ni Psycho Killer Mode heredados de otro escenario.
  2. Ir a Frases; escribir «BICYCLE» en Buscar frases....
    - expect: La grilla contiene la frase de Einstein y no contiene frases cuyo texto no incluya bicycle; esperar actualización de React antes de contar.
  3. Borrar el texto de búsqueda.
    - expect: Regresa el conjunto completo de IDs del inventario inicial, sin duplicados.
  4. Limpieza obligatoria en finally/teardown, incluso si falla un paso: no se crearon recursos; cerrar el contexto y comprobar que no cambió la API.
    - expect: Éxito: se cumplen todas las expectativas funcionales y la limpieza termina. Fallo: cualquier resultado distinto, recurso propio residual o modificación de datos iniciales; conservar evidencia, no relajar assertions.

#### 1.4. M4 — Reservado al usuario: abrir detalle desde el catálogo

**File:** `tests/manual/detalle-frase.spec.ts`

**Steps:**
  1. Estado inicial independiente: abrir un contexto limpio de Chromium en http://localhost:4173; aplicar el protocolo de datos y limpieza descrito arriba. Usar solo lectura: frase inicial de Gandalf y fuente Lord of the Rings; obtener su ID por GET /quotes.
    - expect: No hay búsqueda, filtro, diálogos ni Psycho Killer Mode heredados de otro escenario.
  2. Ir a Frases y pulsar el encabezado de «All we have to decide is what to do with the time that is given us.».
    - expect: La URL es /quotes/<id de Gandalf>; el encabezado h1 muestra la frase exacta.
  3. Contrastar autor, fuente y etiquetas del detalle con GET /quotes/<id>.
    - expect: Se muestran Gandalf, Lord of the Rings e inspiration, life y fantasy; está disponible Add Tag.
  4. Pulsar Frases en la navegación.
    - expect: Se regresa a /quotes y la frase sigue en el catálogo.
  5. Limpieza obligatoria en finally/teardown, incluso si falla un paso: no se crearon recursos; cerrar el contexto y comprobar que no cambió la API.
    - expect: Éxito: se cumplen todas las expectativas funcionales y la limpieza termina. Fallo: cualquier resultado distinto, recurso propio residual o modificación de datos iniciales; conservar evidencia, no relajar assertions.

### 2. Seis flujos recomendados para IA

**Seed:** `tests/seed.spec.ts`

#### 2.1. IA1 — Filtrar por personaje y restaurar Todos con búsqueda vacía

**File:** `tests/ia/filtro-personajes.spec.ts`

**Steps:**
  1. Estado inicial independiente: abrir un contexto limpio de Chromium en http://localhost:4173; aplicar el protocolo de datos y limpieza descrito arriba. Datos de solo lectura: las dos frases iniciales de Uncle Iroh. Mantener vacía la búsqueda durante todo el flujo.
    - expect: No hay búsqueda, filtro, diálogos ni Psycho Killer Mode heredados de otro escenario.
  2. Ir a Frases; abrir el combobox de personaje y seleccionar la opción Uncle Iroh.
    - expect: La grilla muestra exactamente sus dos frases; todos los autores visibles son Uncle Iroh.
  3. Abrir el combobox y seleccionar Todos.
    - expect: Regresan todos los IDs del inventario inicial; no aparecen duplicados.
  4. Limpieza obligatoria en finally/teardown, incluso si falla un paso: no se crearon recursos; cerrar el contexto y comprobar que no cambió la API.
    - expect: Éxito: se cumplen todas las expectativas funcionales y la limpieza termina. Fallo: cualquier resultado distinto, recurso propio residual o modificación de datos iniciales; conservar evidencia, no relajar assertions.

#### 2.2. IA2 — Rechazar creación sin campos obligatorios y conservar el formulario

**File:** `tests/ia/validacion-nueva-frase.spec.ts`

**Steps:**
  1. Estado inicial independiente: abrir un contexto limpio de Chromium en http://localhost:4173; aplicar el protocolo de datos y limpieza descrito arriba. No preparar recursos. El formulario se envía completamente vacío.
    - expect: No hay búsqueda, filtro, diálogos ni Psycho Killer Mode heredados de otro escenario.
  2. Abrir Nueva frase y pulsar Añadir sin completar campos.
    - expect: POST /quotes/add devuelve 400 con «Faltan campos obligatorios».
    - expect: El diálogo sigue abierto y muestra una alerta «Error al añadir la frase.» con el motivo.
  3. Comparar GET /quotes, GET /characters y GET /tags con el inventario inicial; pulsar Cancelar.
    - expect: No se creó frase, personaje ni etiqueta; el usuario puede cerrar el diálogo.
  4. Limpieza obligatoria en finally/teardown, incluso si falla un paso: no se crearon recursos; cerrar el contexto y comprobar que no cambió la API.
    - expect: Éxito: se cumplen todas las expectativas funcionales y la limpieza termina. Fallo: cualquier resultado distinto, recurso propio residual o modificación de datos iniciales; conservar evidencia, no relajar assertions.

#### 2.3. IA3 — Psycho Killer Mode: cancelar y confirmar eliminación de una frase propia

**File:** `tests/ia/eliminar-frase.spec.ts`

**Steps:**
  1. Estado inicial independiente: abrir un contexto limpio de Chromium en http://localhost:4173; aplicar el protocolo de datos y limpieza descrito arriba. Preparar por API una frase «Eliminar <UUID>», personaje «Autor eliminar <UUID>», fuente «Fuente <UUID>» y tags []; registrar frase y personaje nuevos antes de abrir /quotes.
    - expect: No hay búsqueda, filtro, diálogos ni Psycho Killer Mode heredados de otro escenario.
  2. Ir a Frases y buscar el texto exacto propio; comprobar que Psycho Killer Mode está apagado.
    - expect: Solo se muestra la frase propia y su tarjeta no tiene botón de papelera.
  3. Activar el switch de Psycho Killer Mode y pulsar la papelera de esa tarjeta.
    - expect: Aparece «¿Deseas eliminar la frase?» y el texto exacto de la frase que será eliminada permanentemente; la URL sigue en /quotes.
  4. Pulsar Cancelar y comprobar GET /quotes/<id>.
    - expect: El diálogo se cierra, la tarjeta permanece y la API responde 200; no hubo DELETE.
  5. Abrir de nuevo la papelera y pulsar Eliminar; esperar DELETE /quotes/delete/<id>.
    - expect: La API responde 200, se cierra el diálogo, desaparece la tarjeta y GET /quotes/<id> responde 404.
  6. Recargar el catálogo y buscar de nuevo la frase propia.
    - expect: La frase no reaparece; los datos iniciales permanecen.
  7. Limpieza obligatoria en finally/teardown, incluso si falla un paso: eliminar únicamente la frase propia si aún existe y su personaje propio; 404 de una frase ya eliminada es válido por la API http://127.0.0.1:5000, según el registro de IDs; verificar ausencia y conservación del inventario inicial.
    - expect: Éxito: se cumplen todas las expectativas funcionales y la limpieza termina. Fallo: cualquier resultado distinto, recurso propio residual o modificación de datos iniciales; conservar evidencia, no relajar assertions.

#### 2.4. IA4 — Agregar varias etiquetas nuevas con espacios y separadores vacíos

**File:** `tests/ia/agregar-etiquetas.spec.ts`

**Steps:**
  1. Estado inicial independiente: abrir un contexto limpio de Chromium en http://localhost:4173; aplicar el protocolo de datos y limpieza descrito arriba. Preparar por API una frase «Etiquetar <UUID>», autor «Autor etiquetas <UUID>», fuente «Fuente <UUID>» y tags []; reservar etiquetas únicas «uno-<UUID>» y «dos-<UUID>».
    - expect: No hay búsqueda, filtro, diálogos ni Psycho Killer Mode heredados de otro escenario.
  2. Abrir directamente /quotes/<id propio>, pulsar Add Tag y escribir « uno-<UUID> , , dos-<UUID> , » en el campo con placeholder chile, humor, tv.
    - expect: Aparece el diálogo Nuevas etiquetas para la frase; la edición no modifica todavía la API.
  3. Pulsar Agregar etiquetas y registrar respuesta e IDs de etiquetas.
    - expect: POST /quotes/<id>/tags devuelve 201 con las dos etiquetas normalizadas, sin cadenas vacías.
    - expect: Se cierra el diálogo y aparece «Etiquetas añadidas exitosamente»; cada etiqueta se ve exactamente una vez.
  4. Recargar el detalle y contrastar GET /quotes/<id>.
    - expect: Persisten ambas etiquetas exactamente una vez, con los mismos IDs; frase, personaje y fuente no cambian.
  5. Limpieza obligatoria en finally/teardown, incluso si falla un paso: eliminar únicamente frase, personaje y las dos etiquetas propias; registrar también etiquetas de respuesta o por nombre único si una assertion falla antes por la API http://127.0.0.1:5000, según el registro de IDs; verificar ausencia y conservación del inventario inicial.
    - expect: Éxito: se cumplen todas las expectativas funcionales y la limpieza termina. Fallo: cualquier resultado distinto, recurso propio residual o modificación de datos iniciales; conservar evidencia, no relajar assertions.

#### 2.5. IA5 — Regresión: combinar búsqueda con personaje y volver a Todos

**File:** `tests/ia/busqueda-con-filtro.spec.ts`

**Steps:**
  1. Estado inicial independiente: abrir un contexto limpio de Chromium en http://localhost:4173; aplicar el protocolo de datos y limpieza descrito arriba. Datos de solo lectura: dos frases de Uncle Iroh; una comienza «Life happens wherever», la otra «Sometimes the best way». Este flujo evalúa la intersección, no el filtro aislado.
    - expect: No hay búsqueda, filtro, diálogos ni Psycho Killer Mode heredados de otro escenario.
  2. Ir a Frases; buscar «Life happens wherever» y esperar a que desaparezca la frase Sometimes.
    - expect: Solo se ve la frase Life happens wherever.
  3. Seleccionar Uncle Iroh sin cambiar la búsqueda; esperar el cierre del desplegable y comprobar el estado estable.
    - expect: Debe seguir visible únicamente Life happens wherever; el filtro no puede ignorar el texto. BUG B1 observado: aparecen las dos frases de Iroh.
  4. Cambiar la búsqueda a «Sometimes» manteniendo Uncle Iroh.
    - expect: Solo se muestra Sometimes; ambas condiciones se aplican a la vez.
  5. Seleccionar Todos, conservando «Sometimes».
    - expect: Debe conservarse la coincidencia Sometimes y no reaparecer todo el catálogo. BUG B1 observado: cambiar personaje ignora la búsqueda.
  6. Cambiar ahora la búsqueda a «Life happens wherever» con Todos activo.
    - expect: Debe aparecer la frase Life happens wherever. BUG B2 observado: la grilla queda vacía.
  7. Limpieza obligatoria en finally/teardown, incluso si falla un paso: no se crearon recursos; cerrar el contexto y comprobar que no cambió la API.
    - expect: Éxito: se cumplen todas las expectativas funcionales y la limpieza termina. Fallo: cualquier resultado distinto, recurso propio residual o modificación de datos iniciales; conservar evidencia, no relajar assertions.

#### 2.6. IA6 — Regresión: agregar una etiqueta ya asociada no debe duplicarla visualmente

**File:** `tests/ia/etiqueta-repetida.spec.ts`

**Steps:**
  1. Estado inicial independiente: abrir un contexto limpio de Chromium en http://localhost:4173; aplicar el protocolo de datos y limpieza descrito arriba. Preparar por API frase «Repetida <UUID>», personaje «Autor repetida <UUID>», fuente «Fuente <UUID>», etiqueta «repetida-<UUID>»; registrar todos sus IDs.
    - expect: No hay búsqueda, filtro, diálogos ni Psycho Killer Mode heredados de otro escenario.
  2. Abrir /quotes/<id propio>; comprobar que la etiqueta aparece una sola vez.
    - expect: GET /quotes/<id> contiene exactamente una relación con ese ID de etiqueta.
  3. Pulsar Add Tag; escribir exactamente la misma etiqueta y pulsar Agregar etiquetas; registrar respuesta antes de navegar.
    - expect: La operación puede informar éxito o ausencia de cambios, pero no debe crear duplicados.
    - expect: BUG B3 comprobado: POST devuelve 201 con la etiqueta y la interfaz pasa de una a dos burbujas.
  4. Contar las burbujas de esa etiqueta en el detalle y comparar con GET /quotes/<id>; después recargar.
    - expect: Éxito requerido: una sola burbuja antes y después de recargar, y una sola relación en la API.
    - expect: Observado en vivo: UI=2, API=1, UI tras recarga=1; el test debe denunciar esta discrepancia.
  5. Limpieza obligatoria en finally/teardown, incluso si falla un paso: eliminar únicamente frase, personaje y etiqueta propios por la API http://127.0.0.1:5000, según el registro de IDs; verificar ausencia y conservación del inventario inicial.
    - expect: Éxito: se cumplen todas las expectativas funcionales y la limpieza termina. Fallo: cualquier resultado distinto, recurso propio residual o modificación de datos iniciales; conservar evidencia, no relajar assertions.

### 3. Candidatos adicionales de reserva

**Seed:** `tests/seed.spec.ts`

#### 3.1. R1 — Reserva: búsqueda sin coincidencias y recuperación

**File:** `tests/reserva/busqueda-vacia.spec.ts`

**Steps:**
  1. Estado inicial independiente: abrir un contexto limpio de Chromium en http://localhost:4173; aplicar el protocolo de datos y limpieza descrito arriba. Solo lectura; búsqueda «inexistente-<UUID>» y filtro sin seleccionar.
    - expect: No hay búsqueda, filtro, diálogos ni Psycho Killer Mode heredados de otro escenario.
  2. Ir a Frases y buscar el texto único inexistente.
    - expect: La grilla no contiene tarjetas. La app observada no muestra mensaje explicativo de vacío; no exigirlo sin acuerdo de UX.
  3. Borrar la búsqueda.
    - expect: Se recupera exactamente el inventario inicial.
  4. Limpieza obligatoria en finally/teardown, incluso si falla un paso: no se crearon recursos; cerrar el contexto y comprobar que no cambió la API.
    - expect: Éxito: se cumplen todas las expectativas funcionales y la limpieza termina. Fallo: cualquier resultado distinto, recurso propio residual o modificación de datos iniciales; conservar evidencia, no relajar assertions.

#### 3.2. R2 — Reserva: error visible al agregar etiquetas vacías

**File:** `tests/reserva/etiquetas-vacias.spec.ts`

**Steps:**
  1. Estado inicial independiente: abrir un contexto limpio de Chromium en http://localhost:4173; aplicar el protocolo de datos y limpieza descrito arriba. Preparar frase «Vacía <UUID>», autor «Autor vacía <UUID>», fuente «Fuente <UUID>» y tags []; abrir su detalle.
    - expect: No hay búsqueda, filtro, diálogos ni Psycho Killer Mode heredados de otro escenario.
  2. Pulsar Add Tag y Agregar etiquetas con el campo vacío; inspeccionar respuesta y diálogo.
    - expect: La API devuelve 400 con «No se proporcionó ninguna etiqueta»; no cambia GET /quotes/<id>.
    - expect: Debe mostrarse un error visible y mantenerse el diálogo para corregir. BUG B4: el diálogo permanece, pero no presenta el error; solo aparece en consola/red.
  3. Cerrar con Cancelar.
    - expect: Se recupera el detalle sin modificación de etiquetas.
  4. Limpieza obligatoria en finally/teardown, incluso si falla un paso: eliminar únicamente frase y personaje propios por la API http://127.0.0.1:5000, según el registro de IDs; verificar ausencia y conservación del inventario inicial.
    - expect: Éxito: se cumplen todas las expectativas funcionales y la limpieza termina. Fallo: cualquier resultado distinto, recurso propio residual o modificación de datos iniciales; conservar evidencia, no relajar assertions.

#### 3.3. R3 — Reserva: personaje nuevo disponible inmediatamente en el filtro

**File:** `tests/reserva/personaje-nuevo.spec.ts`

**Steps:**
  1. Estado inicial independiente: abrir un contexto limpio de Chromium en http://localhost:4173; aplicar el protocolo de datos y limpieza descrito arriba. Abrir /quotes sin filtros; datos únicos: frase «Personaje nuevo <UUID>», personaje «Nuevo autor <UUID>», fuente «Fuente <UUID>» y etiqueta «nuevo-<UUID>». Este escenario evalúa refresco del selector, no repite el objetivo de M1.
    - expect: No hay búsqueda, filtro, diálogos ni Psycho Killer Mode heredados de otro escenario.
  2. Abrir Nueva frase, completar Frase, abrir Personaje, buscar el autor único y pulsar Create con ese nombre; completar Fuente y Etiquetas; pulsar Añadir.
    - expect: POST /quotes/add devuelve 201; registrar IDs de frase, personaje y etiqueta. La nueva tarjeta aparece.
  3. Sin recargar ni abandonar /quotes, abrir el filtro de personaje y buscar el autor recién creado.
    - expect: Debe existir una opción seleccionable con ese autor; no debe ofrecer crear un personaje desde un filtro de consulta.
    - expect: BUG B5 observado: el autor no aparece y se ofrece Create; no pulsar esa opción en el filtro.
  4. Recargar /quotes, abrir el filtro y seleccionar el mismo autor.
    - expect: El autor ahora aparece; su selección devuelve únicamente la frase propia.
  5. Limpieza obligatoria en finally/teardown, incluso si falla un paso: eliminar únicamente frase, personaje y etiqueta propios por la API http://127.0.0.1:5000, según el registro de IDs; verificar ausencia y conservación del inventario inicial.
    - expect: Éxito: se cumplen todas las expectativas funcionales y la limpieza termina. Fallo: cualquier resultado distinto, recurso propio residual o modificación de datos iniciales; conservar evidencia, no relajar assertions.

#### 3.4. R4 — Reserva: rechazar duplicado exacto de una frase propia

**File:** `tests/reserva/frase-duplicada.spec.ts`

**Steps:**
  1. Estado inicial independiente: abrir un contexto limpio de Chromium en http://localhost:4173; aplicar el protocolo de datos y limpieza descrito arriba. Preparar por API frase «Duplicada <UUID>», personaje «Autor duplicada <UUID>», fuente «Fuente <UUID>», tags []; registrar IDs. Candidato no comprobado en vivo durante esta exploración.
    - expect: No hay búsqueda, filtro, diálogos ni Psycho Killer Mode heredados de otro escenario.
  2. Abrir Nueva frase; ingresar exactamente el texto preparado, seleccionar su personaje y completar la misma fuente; pulsar Añadir.
    - expect: La API devuelve 409 con «La cita ya existe»; el diálogo muestra el error y permanece abierto.
  3. Consultar GET /quotes y contar coincidencias exactas del texto único; cancelar el diálogo.
    - expect: Solo existe la frase preparada, con el mismo ID; no hay recursos secundarios nuevos.
  4. Limpieza obligatoria en finally/teardown, incluso si falla un paso: eliminar únicamente frase y personaje propios, y cualquier recurso adicional del UUID si el rechazo falla por la API http://127.0.0.1:5000, según el registro de IDs; verificar ausencia y conservación del inventario inicial.
    - expect: Éxito: se cumplen todas las expectativas funcionales y la limpieza termina. Fallo: cualquier resultado distinto, recurso propio residual o modificación de datos iniciales; conservar evidencia, no relajar assertions.

#### 3.5. R5 — Reserva: frase diaria coherente con la API

**File:** `tests/reserva/frase-diaria.spec.ts`

**Steps:**
  1. Estado inicial independiente: abrir un contexto limpio de Chromium en http://localhost:4173; aplicar el protocolo de datos y limpieza descrito arriba. Solo lectura: obtener GET /quotes/daily y conservar su respuesta; ejecutar sin cruzar el cambio de día del servidor.
    - expect: No hay búsqueda, filtro, diálogos ni Psycho Killer Mode heredados de otro escenario.
  2. Abrir Frase diaria en /.
    - expect: Encabezado h1, autor, fuente y conjunto de etiquetas coinciden con /quotes/daily; Add Tag está disponible.
  3. Ir a Frases y volver a Frase diaria durante el mismo día.
    - expect: La frase diaria conserva ID y contenido; no exigir una frase concreta ni que cambie al recargar.
  4. Limpieza obligatoria en finally/teardown, incluso si falla un paso: no se crearon recursos; cerrar el contexto y comprobar que no cambió la API.
    - expect: Éxito: se cumplen todas las expectativas funcionales y la limpieza termina. Fallo: cualquier resultado distinto, recurso propio residual o modificación de datos iniciales; conservar evidencia, no relajar assertions.
