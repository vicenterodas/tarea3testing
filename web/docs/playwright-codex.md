# Agentes de Playwright con Codex en esta tarea

Se instalaron las definiciones oficiales con:

```sh
npx playwright init-agents --loop=codex
```

Las definiciones están en `.codex/agents/playwright_test_*.toml` y registran el
servidor MCP `playwright-test`. La documentación oficial describe el proceso
[Planner → Generator → Healer](https://playwright.dev/docs/test-agents).

## Ejecución usada

`scripts/run-playwright-agent.py` carga las instrucciones y herramientas MCP de la
definición instalada, y ejecuta Codex CLI con revisión automática de permisos,
sandbox y sin cargar configuración personal adicional. Requiere Python 3.11+,
Codex CLI con sesión iniciada, dependencias de `web/`, Chromium y la API encendida.
Los prompts se pasan mediante un archivo de texto, sin interpolarlos en comandos
de shell.

```sh
python3 scripts/run-playwright-agent.py planner ruta/al/prompt.txt
python3 scripts/run-playwright-agent.py generator ruta/al/prompt.txt
python3 scripts/run-playwright-agent.py healer ruta/al/prompt.txt
```

El Planner debe usar `planner_setup_page` con `tests/seed.spec.ts`, explorar con
`browser_*` y guardar `tests/plan-planner.md` con `planner_save_plan`. Ese documento
no se edita después de generarlo. El refinamiento se guarda por separado en
`tests/plan-final.md`.

El Generator debe usar, por cada escenario, `generator_setup_page`, las acciones y
verificaciones de navegador, `generator_read_log` y `generator_write_test`. La
suite de IA usa `@ia` y `@codex`, y cada archivo enlaza el plan y el seed.

La auditoría de la ejecución registró una preparación y un guardado de plan, seis
preparaciones del Generator y seis archivos distintos guardados mediante su
herramienta. Después se refinó el selector del filtro: el botón y el buscador
emergente comparten rol `combobox`; se espera el cierre y se identifica el botón
por su texto visible, porque no expone un nombre accesible. Ese caso pasó tres
repeticiones, incluidas ejecuciones en paralelo.

La primera exploración limitada por permisos se descartó antes de repetirla con
revisión automática. El plan entregable procede de la exploración interactiva
completa posterior. Su SHA-256 al terminar el Planner es:

```text
1253082da4a6e5302d75dbc09beb884172fffa730376dc83b555395e784b07a1
```

## Aislamiento y bugs

Los datos propios usan UUID. `tests/support/test-data.ts` elimina frases,
personajes y etiquetas propios en el teardown, también si falla una assertion.
Los IDs iniciales se conservan y no se reinicia la base desde Playwright.
No ejecutar pytest simultáneamente, porque la configuración base comparte
`db_test` con el servicio de la aplicación.

Las peticiones de preparación y limpieza usan `127.0.0.1:5000`: en este Mac,
`localhost:5000` responde desde AirPlay. La aplicación de tests usa el `webServer`
configurado en `localhost:4173`.

Los escenarios de bug conservan la expectativa correcta y usan `test.fail` junto
a la assertion que reproduce el fallo observado. Se ejecutan; no se omiten con
`skip` ni `fixme`. Si el bug se corrige y el test pasa, Playwright informará un pase
inesperado para revisar y retirar esa marca.

## Validación realizada

La suite activa contiene siete tests únicos: un `@manual` del código base y seis
`@ia`/`@codex`. La ejecución con dos workers y trazas completó cinco tests con
estado `passed` y dos bugs con estado `failed` esperado; no hubo errores
inesperados, tests omitidos ni resultados inestables. Playwright resume los siete
como aprobados porque los dos fallos coinciden con su estado esperado.

Se conservaron siete trazas. La comprobación posterior comparó íntegramente
frases, personajes y etiquetas con el inventario anterior: seguían las mismas
10 frases, 9 personajes y 7 etiquetas, incluidos sus valores y relaciones. El
plan original conserva la huella SHA-256 indicada arriba. La comprobación estricta
de TypeScript también pasó.

## Parte manual pendiente

El ejemplo del código base sigue siendo el primer test `@manual`. Los otros tres
se prepararon como borradores de IA, por petición del estudiante, en
`tests/borradores-manuales.spec.ts.txt`, y se validaron por separado con el tag
`@borrador`. No forman parte del conteo final hasta que el estudiante los
reescriba. Ver `tests/guia-manuales.md`.
